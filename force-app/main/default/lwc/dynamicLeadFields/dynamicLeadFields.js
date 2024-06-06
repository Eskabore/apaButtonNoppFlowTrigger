import { LightningElement, wire, api } from 'lwc';
import getPartnerFields from '@salesforce/apex/PartnerFieldsController.getPartnerFields';
import { getRecord } from 'lightning/uiRecordApi';

const FIELDS = ['Lead.Answered_Questions__c', 'Lead.Comments__c', 'Lead.Images__c'];

export default class DynamicLeadFields extends LightningElement {
    @api recordId;
    partnerFields = []; // All fields, categorized or not
    visibleFields = []; // Initially visible, non-categorized fields
    installationFields = []; // Fields dependent on 'installation_ah'
    appointmentFields = []; // Fields dependent on 'appointment_ah'

    images = []; // Store images

    questionsAnswers = []; // Storage for dynamically fetched questions and answers
    comments = '';

    activeTab = 'fields';

    isExpanded = false; // Controls visibility of extra fields
    error; // Stores error messages

    // Wire service to retrieve fields from Apex
    @wire(getPartnerFields, { leadId: '$recordId' })
    wiredPartnerFields({ error, data }) {
        if (data) {
            console.log('Data received from Apex:', data);
            this.error = undefined;

            // Make sure that data.fields is an object before attempting to transform
            if (data.fields && typeof data.fields === 'object' && !Array.isArray(data.fields)) {
                const fieldsArray = this.transformPartnerFields(data.fields);
                this.processFields(fieldsArray);
            } else {
                console.error('Expected data.fields to be an object, received:', data.fields);
                this.partnerFields = []; // Fallback to an empty array
            }
        } else if (error) {
            this.error = error;
            console.error('Error retrieving fields:', error);
            return;
        }
    }

    // Wire service to retrieve fields directly from the Lead object
    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    wiredLead({ error, data }) {
        if (data) {
            const answeredQuestionsJson = data.fields.Answered_Questions__c.value;
            if (answeredQuestionsJson) {
                // Parse the JSON string and convert it into an array of objects
                const answeredQuestionsObj = JSON.parse(answeredQuestionsJson);
                this.questionsAnswers = Object.entries(answeredQuestionsObj).map(([question, answer]) => ({
                    question: question,
                    answer: answer
                }));
            } else {
                this.questionsAnswers = [];
            }

            // Set comments
            this.comments = data.fields.Comments__c.value || '';

            // Set images
            const imagesJson = data.fields.Images__c.value;
            if (imagesJson) {
                this.images = JSON.parse(imagesJson);
            } else {
                this.images = [];
            }

        } else if (error) {
            this.error = error;
            console.error('Error fetching Lead data:', error);
        }
    }

    // Transform fields into structured objects
    transformPartnerFields(fieldsObject) {
        if (typeof fieldsObject !== 'object' || fieldsObject === null) {
            console.error('The fields data should be an object:', fieldsObject);
            return [];
        }

        return Object.keys(fieldsObject).reduce((fieldsArray, key) => {
            const field = fieldsObject[key];
            // Log each field to verify its content
            console.log(`Processing field: ${key}`, field);

            // Modify phone or mobile numbers starting with '00' to start with '+'
            if (this.isPhoneNumber(field.value)) {
                field.value = this.transformPhoneNumber(field.value);
            }

            if (field.label === 'Telefon der Kontaktperson' || field.label === 'Postleitzahl der Kontaktperson' || field.label === 'Mobil der Kontaktperson') {
                fieldsArray.push({
                    label: field.label,
                    value: field.value ?? '',  // Default value if null or undefined
                    isText: true,  // Explicitly marking as text
                    isNumber: false,
                    isDate: false,
                    dependentField: field.Dependent_Field__c ?? '',
                    dependentValue: field.Dependent_Value__c ?? '',
                    isDependent: !!field.Dependent_Field__c && !!field.Dependent_Value__c
                });
            }
            // Only process fields with a non-null and non-empty 'label'
            else if (field.label && field.value !== undefined) { // Ensures empty strings are considered
                fieldsArray.push({
                    label: field.label,
                    value: field.value ?? '',  // Default value if null or undefined
                    isText: typeof field.value === 'string' && !this.isNumber(field.value) && !this.isDate(field.value),
                    isNumber: this.isNumber(field.value),
                    isDate: this.isDate(field.value),
                    dependentField: field.Dependent_Field__c ?? '',
                    dependentValue: field.Dependent_Value__c ?? '',
                    isDependent: !!field.Dependent_Field__c && !!field.Dependent_Value__c
                });
            }
            return fieldsArray;
        }, []);
    }

    // Transform phone number starting with '00' to '+'
    transformPhoneNumber(phoneNumber) {
        if (phoneNumber.startsWith('00')) {
            return '+' + phoneNumber.slice(2);
        }
        return phoneNumber;
    }

    // Check if a field's value is a phone number
    isPhoneNumber(value) {
        const phoneRegex = /^00\d+$/;
        return phoneRegex.test(value);
    }

    // Process fields to categorize them based on dependentField value
    processFields(fieldsArray) {
        // Reset categories
        this.visibleFields = [];
        this.extraFields = [];
        this.installationFields = [];
        this.appointmentFields = [];

        // Categorize fields based on their properties
        fieldsArray.forEach(field => {
            console.log('Checking field for dependencies:', field);
            if (field.isDependent) {
                if (field.dependentField === "installation_ah") {
                    this.installationFields.push(field);
                } else if (field.dependentField === "appointment_ah") {
                    this.appointmentFields.push(field);
                }
            } else {
                // Only add to visible fields if they have a non-empty value
                if (field.value) {
                    if (this.visibleFields.length < 4) {
                        this.visibleFields.push(field);
                    } else {
                        this.extraFields.push(field);
                    }
                }
            }
        });

        console.log('Fields organized into categories:', {
            visibleFields: this.visibleFields,
            extraFields: this.extraFields,
            installationFields: this.installationFields,
            appointmentFields: this.appointmentFields
        });
    }

    // Check if a field's value is a number
    isNumber(value) {
        return value != null && !isNaN(parseFloat(value)) && isFinite(value);
    }

    // Check if a field's value is a date
    isDate(value) {
        if (typeof value !== 'string' || value.trim() === '') {
            return false;
        }
        const date = new Date(value);
        return !isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
    }

    // Toggle visibility of extra fields
    toggleExtraFields() {
        this.isExpanded = !this.isExpanded;
        console.log(`Expanded state changed: ${this.isExpanded}`);
    }

    // Utility to signal a duplicate (stub function)
    signalDuplicate() {
        console.log('Duplicate signal sent for record:', this.recordId);
    }

    connectedCallback() {
        this.template.addEventListener('click', this.handleTabClick.bind(this));
    }

    // Computed property for determining CSS classes of the arrow icon
    get arrowClasses() {
        return `down-arrow ${this.isExpanded ? 'is-expanded' : ''}`;
    }

    // Computed property for determining CSS classes of the expandable section
    get computedSectionClass() {
        return `expandable-section ${this.isExpanded ? 'is-expanded' : ''}`;
    }

    // Computed property to check if there are enough fields to need more fields section
    get hasMoreFields() {
        // Check if the arrays are defined before trying to access their length
        return (this.extraFields && this.extraFields.length > 0) ||
            (this.installationFields && this.installationFields.length > 0) ||
            (this.appointmentFields && this.appointmentFields.length > 0);
    }

    // Computed property to determine the CSS class for the comments tab
    get commentsTabClass() {
        return this.comments ? 'slds-tabs_default__item' : 'slds-tabs_default__item slds-tabs_default__item_empty';
    }

    // Computed property to truncate comments for the bottom section
    get truncatedComments() {
        return this.comments.length > 100 ? this.comments.substring(0, 100) + '...' : this.comments;
    }

    // Handle tab switching
    handleTabClick(event) {
        const tab = event.target.dataset.tab;
        if (tab) {
            this.activeTab = tab;
        }
    }

    // Computed properties for active tab content
    get isFieldsTabActive() {
        return this.activeTab === 'fields';
    }

    get isCommentsTabActive() {
        return this.activeTab === 'comments';
    }

    get isImagesTabActive() {
        return this.activeTab === 'images';
    }

    // Check if comments should be displayed in the bottom section
    get showTruncatedComments() {
        return this.comments && !this.isCommentsTabActive;
    }
}
