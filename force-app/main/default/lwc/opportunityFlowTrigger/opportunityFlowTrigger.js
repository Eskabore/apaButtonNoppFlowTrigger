import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
import triggerFlows from '@salesforce/apex/OpportunityFlowTriggerController.triggerFlows';
import resetFieldToZero from '@salesforce/apex/ResetFieldToZero.resetStateField';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import STATE_FIELD from '@salesforce/schema/Opportunity.State__c';
import PRICEBOOK2ID_FIELD from '@salesforce/schema/Opportunity.Pricebook2Id';

export default class OpportunityFlowTrigger extends LightningElement {
    @api recordId;
    opportunityData; // Used to cache the response for refreshApex
    isLoading = false; // Track loading state

    @wire(getRecord, { recordId: '$recordId', fields: [STATE_FIELD, PRICEBOOK2ID_FIELD] })
    wiredOpportunity(response) {
        this.opportunityData = response;
        // Error handling is not needed here as we are using getFieldValue below
    }

    get isCorrectPricebook() {
        const pricebook2Id = getFieldValue(this.opportunityData.data, PRICEBOOK2ID_FIELD);
        return pricebook2Id === '01s7Q00000JBtVpQAL' || pricebook2Id === null;
    }

    get buttonLabel() {
        return this.isLoading ? 'Lädt...' : 'Automatisierte Produkt Auswahl';
    }

    handleClick() {
        if (this.opportunityData) {
            if (this.isCorrectPricebook) {
                this.isLoading = true;
                this.showToast('Information', 'Ihre Anfrage wird bearbeitet...', 'info');
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
                    })
                    .finally(() => {
                        this.isLoading = false;
                    });
            } else {
                this.showToast('Achtung', 'Bitte wählen Sie das Preisbuch "Wärmepumpen Fuchs" vor der automatischen Auswahl.', 'warning');
            }
        } else {
            this.showToast('Fehler', 'Opportunity nicht geladen.', 'error');
        }
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
