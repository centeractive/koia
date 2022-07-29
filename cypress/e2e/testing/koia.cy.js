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

  it('check CouchDb-Settings', () => {
    //cy.contains('button', ' IndexedDB ').click()
    cy.contains('button', ' CouchDB ').click()
    
    //cy.get('#protocol').should('have.value', 'HTTP')
    cy.get('#host').should('have.value', 'localhost')
    cy.get('#port').should('have.value', '5984')
    cy.get('#user').should('have.value', 'admin')
    cy.get('#password').should('have.value', 'admin')
    cy.contains('button', 'Cancel').click()
  })

  
  it.only('check File-Upload', () => {
    cy.get('#start_button').click()
 //   cy.get('#select_file_button').invoke('removeAttr', 'target').click()
    //upload file with attachFile

    const fileName = 'test.csv'

    //cy.get('#select_file_button]')
    //.attachFile('myfixture.json',{force :true});

  //  cy.fixture(fileName).then(fileContent => {
  //    cy.get('#select_file_button').attachFile
  //    ({ fileContent, fileName, mimeType: 'text/csv' },
  //     { subjectType: 'input' ,force:true}).trigger('init');
  //  });

    cy.fixture('test.csv').then((fileContent) => {

    //  cy.get('#mat-select-value-3').select('JSON')
      cy.get('#select_file_button')
        .attachFile(
          { filePath: 'test.csv'},
          { fileContent, mimeType: 'text/csv' },
          { subjectType: 'input'}
        ).trigger('submit')
    })

    cy.wait(2000)
  })

  it('check File-Upload', () => {
    
    cy.get('#start_button').click()


    const fileName = 'test.csv'

    cy.fixture('test.csv').then((fileContent) => {

    //  cy.get('#mat-select-value-3').select('JSON')
    cy.get('#select_file_button').invoke('removeAttr', 'target').click()
    
    })
cy.wait(2000)

  })

})
