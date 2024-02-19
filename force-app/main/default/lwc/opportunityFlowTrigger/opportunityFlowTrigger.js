import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
import triggerFlows from '@salesforce/apex/OpportunityFlowTriggerController.triggerFlows';
import resetFieldToZero from '@salesforce/apex/ResetFieldToZero.resetStateField';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import STATE_FIELD from '@salesforce/schema/Opportunity.State__c';

export default class OpportunityFlowTrigger extends LightningElement {
    @api recordId;
    opportunityData; // Used to cache the response for refreshApex

    @wire(getRecord, { recordId: '$recordId', fields: [STATE_FIELD] })
    wiredOpportunity({ error, data }) {
        if (data) {
            this.opportunityData = data;
        } else if (error) {
            this.showToast('Fehler', 'Fehler beim Laden der Opportunity-Daten', error.body.message, 'fehler');
            console.error('Fehler beim Abrufen von Opportunity-Daten:', error);
        }
    }

    handleClick() {
        triggerFlows({ opportunityId: this.recordId })
            .then(() => {
                this.showToast('Erfolg', 'Einen Moment bitte, die Produkte werden hinzugefügt.', 'success');
                return refreshApex(this.opportunityData);
            })
            .then(() => {
                this.resetState(); // No more setTimeout, we can call it directly
            })
            .catch(error => {
                this.showToast('Fehler', error.body?.message || 'Unbekannter Fehler', 'error');
            });
    }

    resetState() {
        resetFieldToZero({ opportunityId: this.recordId })
            .then(() => refreshApex(this.opportunityData))
            .then(() => {
                this.showToast('Erfolg', 'Der Status wurde zurückgesetzt.', 'success');
            })
            .catch(error => {
                this.showToast('Fehler', error.body?.message || 'Unbekannter Fehler', 'error');
            });
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }

    get stateValue() {
        // Safely check if `this.opportunityData` and `this.opportunityData.data` are defined before trying to access `STATE_FIELD`
        return this.opportunityData && this.opportunityData.data
            ? getFieldValue(this.opportunityData.data, STATE_FIELD)
            : undefined; // Return undefined or a default value if data is not available
    }
}
