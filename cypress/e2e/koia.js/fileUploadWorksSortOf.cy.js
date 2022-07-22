/// <reference types="cypress" />
// Welcome to Koia!
//


describe('first example', () => {
  
    beforeEach(() => {
        // Cypress starts Koia.io for each test
    
        cy.visit('https://www.koia.io/intro/index.html')
        cy.get('.promo > .container > .intro')
        .should('have.text','Create graphs and pivot tables online from CSV, Excel or JSON data.')
        cy.get('.promo > .container > :nth-child(3) > .btn').click()
      })
 
    
    it('check File-Upload', () => {
      cy.get('#start_button').click()
     
      //upload file with attachFile
  
      const fileName = 'test.csv'
   
      cy.fixture('test.csv').then((fileContent) => {
  
      //  cy.get('#mat-select-value-3').select('JSON')
        cy.get('#select_file_button')
          .attachFile(
            { filePath: 'test.csv'},
            { fileContent, mimeType: 'text/csv' },
            { subjectType: 'input'}
          ).trigger('submit',{force: true})
      })
      cy.get('#select_file_button').click({force: true})
      cy.wait(2000)


    })
  

    it('check File-Upload', () => {
        cy.get('#start_button').click()
     //   cy.get('#select_file_button').invoke('removeAttr', 'target').click()
        //upload file with attachFile
    
        const fileName = 'test.csv'
     
        cy.fixture('test.csv', { encoding: null }).as('myfixture')
        cy.get('#fileInput').attachFile('test.csv')
        cy.get('#select_file_button').invoke('removeAttr', 'target').click()
      
     //   cy.get('#but_detect_columns').click()
  
  
      })
    
      
  
  })
  