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
    wiredOpportunity(response) {
        this.opportunityData = response;
        // Error handling is not needed here as we are using getFieldValue below
    }

    handleClick() {
        triggerFlows({ opportunityId: this.recordId })
            .then(() => {
                this.showToast('Erfolg', 'Einen Moment bitte, die Produkte werden hinzugefügt.', 'success');
                return refreshApex(this.opportunityData);
            })
            .then(() => {
                setTimeout(() => this.resetState(), 3000); // Delay for 3 seconds
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
        return getFieldValue(this.opportunityData.data, STATE_FIELD);
    }
}
