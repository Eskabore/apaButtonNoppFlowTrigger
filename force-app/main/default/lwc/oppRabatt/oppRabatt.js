import { LightningElement, api, wire, track} from 'lwc';
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
    @track isRabattPercentChecked = false;
    @track isRabattEurChecked = false;

    // Fetch existing record data to pre-populate fields if they have values
    @wire(getRecord, { recordId: '$recordId', fields: [DISCOUNT_AMOUNT_FIELD, DISCOUNT_PERCENTAGE_FIELD, RABATT_IN_PERCENT_FIELD, RABATT_IN_EUR_FIELD] })
    opportunity;

    get loadedDiscountAmount() {
        return this.opportunity.data ? this.opportunity.data.fields.Discount_Amount__c.value : null;
    }

    get loadedDiscountPercentage() {
        return this.opportunity.data ? this.opportunity.data.fields.Discount_Percentage__c.value : null;
    }

    handleAmountChange(event) {
        this.discountAmount = event.target.value;
    }

    handlePercentageChange(event) {
        this.discountPercentage = event.target.value;
    }

    handleRabattPercentChange(event) {
        this.isRabattPercentChecked = event.target.checked;
    }

    handleRabattEurChange(event) {
        this.isRabattEurChecked = event.target.checked;
    }

    handleSave() {
        const fields = {};
        fields['Id'] = this.recordId;
        if (this.discountAmount !== undefined) {
            fields[DISCOUNT_AMOUNT_FIELD.fieldApiName] = this.discountAmount;
        }
        if (this.discountPercentage !== undefined) {
            fields[DISCOUNT_PERCENTAGE_FIELD.fieldApiName] = this.discountPercentage;
        }

        const recordInput = { fields };

        updateRecord(recordInput)
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Erfolg',
                        message: 'Rabatt aktualisiert',
                        variant: 'success'
                    })
                );
                // Clear the form or do additional actions if needed
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error updating record',
                        message: error.body.message,
                        variant: 'error'
                    })
                );
            });
    }
}
