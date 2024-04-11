import { createElement } from 'lwc';
import DynamicLeadFields from 'c/dynamicLeadFields';
import getPartnerFields from '@salesforce/apex/PartnerFieldsController.getPartnerFields';
// Mocking the module to simulate Apex call
jest.mock(
    '@salesforce/apex/PartnerFieldsController.getPartnerFields',
    () => {
        return {
            default: jest.fn()
        };
    },
    { virtual: true }
);

describe('c-dynamic-lead-fields', () => {
    afterEach(() => {
        // Clean up after each test execution
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        // Reset any mocked functions
        jest.clearAllMocks();
    });

    it('displays partner fields successfully', () => {
        // Arrange
        const APEX_SUCCESS_RESPONSE = {
            fields: {
                baujahr: '2023',
                personenzahl: '2'
            }
        };

        getPartnerFields.mockResolvedValue(APEX_SUCCESS_RESPONSE);

        // Act
        const element = createElement('c-dynamic-lead-fields', {
            is: DynamicLeadFields
        });
        document.body.appendChild(element);

        // Assert
        return Promise.resolve().then(() => {
            const detailElements = element.shadowRoot.querySelectorAll('p');
            expect(detailElements[0].textContent).toBe('baujahr: 2023');
            expect(detailElements[1].textContent).toBe('personenzahl: 2');
        });
    });

    it('displays an error message on failed data fetch', () => {
        // Arrange
        const APEX_FAILURE_RESPONSE = new Error('An error occurred while fetching partner fields.');

        getPartnerFields.mockRejectedValue(APEX_FAILURE_RESPONSE);

        // Act
        const element = createElement('c-dynamic-lead-fields', {
            is: DynamicLeadFields
        });
        document.body.appendChild(element);

        // Assert
        return Promise.resolve().then(() => {
            const errorElement = element.shadowRoot.querySelector('.slds-text-color_error p');
            expect(errorElement.textContent).toBe('An error occurred while fetching partner fields.');
        });
    });
});
