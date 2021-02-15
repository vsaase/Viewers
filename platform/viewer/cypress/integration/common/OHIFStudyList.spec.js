//We are keeping the hardcoded results values for the study list tests
//this is intended to be running in a controled docker environment with test data.
describe('OHIF Study List', function() {
  context('Desktop resolution', function() {
    before(function() {
      cy.openStudyList();
    });

    beforeEach(function() {
      cy.viewport(1750, 720);
      cy.initStudyListAliasesOnDesktop();
      //Clear all text fields
      cy.get('@PatientName').clear();
      cy.get('@MRN').clear();
      cy.get('@AccessionNumber').clear();
      cy.get('@StudyDescription').clear();
      cy.get('@modalities').clear();
    });

    it('searches Patient Name with exact string', function() {
      cy.get('@PatientName').type('Juno');
      //Wait result list to be displayed
      cy.waitStudyList();
      cy.get('@searchResult').should($list => {
        expect($list.length).to.be.eq(1);
        expect($list).to.contain('Juno');
      });
    });

    it('searches MRN with exact string', function() {
      cy.get('@MRN').type('0000003');
      //Wait result list to be displayed
      cy.waitStudyList();
      cy.get('@searchResult').should($list => {
        expect($list.length).to.be.eq(1);
        expect($list).to.contain('0000003');
      });
    });

    it('searches Accession with exact string', function() {
      cy.get('@AccessionNumber').type('0000155811');
      //Wait result list to be displayed
      cy.waitStudyList();
      cy.get('@searchResult').should($list => {
        expect($list.length).to.be.eq(1);
        expect($list).to.contain('0000155811');
      });
    });

    it('searches Modality with camel case', function() {
      cy.get('@modalities').type('Ct');
      //Wait result list to be displayed
      cy.waitStudyList();
      cy.get('@searchResult').should($list => {
        expect($list.length).to.be.greaterThan(1);
        expect($list).to.contain('CT');
      });
    });

    /*
    TODO: Currently broken in dicomweb-server

    it('searches Description with exact string', function() {
      cy.get('@StudyDescription').type('PETCT');
      //Wait result list to be displayed
      cy.waitStudyList();
      cy.get('@searchResult').should($list => {
        expect($list.length).to.be.eq(1);
        expect($list).to.contain('PETCT');
      });
    });
     */

    it('changes Rows per page and checks the study count', function() {
      //Show Rows per page options
      const pageRows = [25, 50, 100];

      //Check all options of Rows
      pageRows.forEach(numRows => {
        cy.get('select').select(numRows.toString()); //Select Rows per page option
        //Wait result list to be displayed
        cy.waitStudyList().then(() => {
          //Compare the search result with the Study Count on the table header
          cy.get('@studyCount')
            .should($studyCount => {
              expect(parseInt($studyCount.text())).to.be.at.most(numRows); //less than or equals to
            })
            .then($studyCount => {
              //Compare to the number of Rows in the search result
              cy.get('@searchResult').then($searchResult => {
                let countResults = $searchResult.length;
                expect($studyCount.text()).to.be.eq(countResults.toString());
              });
            });
        });
      });
    });
  });
});
