import { LightningElement, api, wire } from 'lwc';
import getPartnerFields from '@salesforce/apex/PartnerFieldsController.getPartnerFields';

export default class DynamicLeadFields extends LightningElement {
    @api recordId;
    partnerFields = []; // This includes all fields
    visibleFields = []; // This will hold the initially visible fields
    extraFields = []; // This will hold the fields that are initially hidden
    isExpanded = false; // Controls the visibility of the extra fields
    error;

    // Use wire service to call the Apex method getPartnerFields.
    @wire(getPartnerFields, { leadId: '$recordId' })
    wiredPartnerFields({ error, data }) {
        if (data) {
            this.error = undefined;
            this.partnerFields = this.transformPartnerFields(data.fields);
            this.initializeFieldVisibility(); // Ensure field visibility is initialized here
        } else if (error) {
            this.partnerFields = [];
            this.error = error;
        }
    }

    initializeFieldVisibility() {
        this.visibleFields = this.partnerFields.slice(0, 4);
        this.extraFields = this.partnerFields.slice(4);
    }

    // Method to toggle the expandable section.
    toggleExtraFields() {

        console.log('Before toggling:', this.isExpanded);
        this.isExpanded = !this.isExpanded;
        console.log('After toggling:', this.isExpanded);

        // Toggle which fields are considered "visible" based on the isExpanded state
    if (this.isExpanded) {
        // Show all fields when expanded
        this.visibleFields = [...this.partnerFields];
    } else {
        // Revert to initial state when collapsed
        this.visibleFields = this.partnerFields.slice(0, 4);
    }
    }

    signalDuplicate() {
        // Logic to signal a duplicate
        console.log('Duplicate signal sent for record:', this.recordId);
    }

    // Transform partner fields object into an array of objects suitable for rendering.
    transformPartnerFields(fieldsObject) {
        return Object.entries(fieldsObject).map(([key, value]) => {
            return {
                label: key,
                value: value,
                isText: typeof value === 'string' && !this.isNumber(value) && !this.isDate(value),
                isNumber: this.isNumber(value),
                isDate: this.isDate(value)
            };
        });
    }

    // Helper function to determine if a value is a number.
    isNumber(value) {
        return !isNaN(parseFloat(value)) && isFinite(value);
    }

    // Helper function to determine if the value is a date string.
    isDate(value) {
        // Simple check: dates should be strings with a "-" character typically in ISO format, e.g., "2020-01-01"
        return typeof value === 'string' && !isNaN(Date.parse(value));
    }

    // Computed property to determine the CSS classes for the down arrow
    get arrowClasses() {
        return `down-arrow ${this.isExpanded ? 'is-expanded' : ''}`;
    }

    get computedSectionClass() {
        return `expandable-section ${this.isExpanded ? 'is-expanded' : ''}`;
    }

    get hasMoreFields() {
        return this.partnerFields.length > 4;
    }
}
