import { LightningElement, wire, api } from 'lwc';
import getPartnerFields from '@salesforce/apex/PartnerFieldsController.getPartnerFields';

export default class DynamicLeadFields extends LightningElement {
    @api recordId;
    partnerFields = []; // All fields, categorized or not
    visibleFields = []; // Initially visible, non-categorized fields
    installationFields = []; // Fields dependent on 'installation_ah'
    appointmentFields = []; // Fields dependent on 'appointment_ah'
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

            // Only process fields with a non-null and non-empty 'label'
            if (field.label  && field.value !== undefined) { // Ensures empty strings are considered
                fieldsArray.push({
                    label: field.label,
                    value: field.value ?? 'Default Value',  // Default value if null or undefined
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
        return typeof value === 'string' && value.trim() !== '' && !isNaN(Date.parse(value));
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
}
