import { LightningElement, api, wire } from 'lwc';
import { getRecord, updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import OPPORTUNITY_OBJECT from '@salesforce/schema/Opportunity';
import DISCOUNT_AMOUNT_FIELD from '@salesforce/schema/Opportunity.Discount_Amount__c';
import DISCOUNT_PERCENTAGE_FIELD from '@salesforce/schema/Opportunity.Discount_Percentage__c';
import RABATT_IN_PERCENT_FIELD from '@salesforce/schema/Opportunity.Rabatt_in_Percent__c';
import RABATT_IN_EUR_FIELD from '@salesforce/schema/Opportunity.Rabatt_in_EUR_checkbox__c';


export default class DiscountComponent extends LightningElement {
    @api recordId;
    discountAmount;
    discountPercentage;
    isRabattPercentChecked = false;
    isRabattEurChecked = false;

    @wire(getRecord, {
        recordId: '$recordId',
        fields: [
            DISCOUNT_AMOUNT_FIELD,
            DISCOUNT_PERCENTAGE_FIELD,
            RABATT_IN_PERCENT_FIELD,
            RABATT_IN_EUR_FIELD
        ]
    })
    opportunity;

    get loadedDiscountAmount() {
        return this.opportunity.data?.fields[DISCOUNT_AMOUNT_FIELD.fieldApiName]?.value;
    }

    get loadedDiscountPercentage() {
        return this.opportunity.data?.fields[DISCOUNT_PERCENTAGE_FIELD.fieldApiName]?.value;
    }

    handleInputChange(event) {
        const field = event.target.name;
        this[field] = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    }

    handleSave() {
        const fields = { Id: this.recordId };
        if (this.discountAmount !== undefined) fields[DISCOUNT_AMOUNT_FIELD.fieldApiName] = this.discountAmount;
        if (this.discountPercentage !== undefined) fields[DISCOUNT_PERCENTAGE_FIELD.fieldApiName] = this.discountPercentage;

        updateRecord({ fields })
            .then(() => this.showToast('Erfolg', 'Rabatt aktualisiert', 'successs'))
            .catch(error => this.showToast('Fehler', error.body.message, 'error'));
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}
