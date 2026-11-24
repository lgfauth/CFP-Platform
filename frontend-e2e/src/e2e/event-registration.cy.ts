describe('Cadastro de evento', () => {
  /** Local calendar day `days` from today, as `YYYY-MM-DD` and `DD/MM/AAAA`. */
  function dayFromToday(days: number): { iso: string; display: string } {
    const date = new Date();
    date.setDate(date.getDate() + days);
    const year = String(date.getFullYear());
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return { iso: `${year}-${month}-${day}`, display: `${day}/${month}/${year}` };
  }

  beforeEach(() => {
    cy.visit('/eventos/novo');
    cy.get('h1.cfp-title').should('have.text', 'Cadastre um evento');
  });

  it('cadastra um evento e o exibe no Dashboard', () => {
    // Unique values keep events left in the API's memory by earlier runs from
    // producing a false positive. The date is far from the "tomorrow" boundary.
    const suffix = Date.now();
    const eventName = `Meetup E2E ${suffix}`;
    const eventAddress = `Rua dos Testes, ${suffix} - Porto Alegre`;
    const eventDate = dayFromToday(30);

    cy.get('#event-name').type(eventName);
    cy.get('#event-address').type(eventAddress);
    cy.get('#event-date').type(eventDate.iso);

    cy.get('button.cfp-button-primary')
      .should('be.enabled')
      .and('contain.text', 'Cadastrar evento')
      .click();

    cy.get('.cfp-message-success').should(
      'contain.text',
      'Evento cadastrado com sucesso.'
    );

    cy.contains('nav.cfp-nav a', 'Dashboard').click();
    cy.location('pathname').should('eq', '/');

    cy.contains('#events-section tbody tr', eventName).within(() => {
      cy.contains('td', eventAddress).should('be.visible');
      cy.get('time')
        .should('have.text', eventDate.display)
        .and('have.attr', 'datetime', eventDate.iso);
    });
  });

  it('exibe as mensagens de validação a cada tentativa de envio', () => {
    cy.intercept('POST', '/api/events').as('registerEvent');

    // The submit button stays disabled while the form is invalid, so the
    // attempt is made on the form itself, as pressing Enter in a field would.
    cy.get('button.cfp-button-primary').should('be.disabled');

    // 1. Empty form: every required field reports its own message.
    cy.get('form.cfp-form').submit();
    cy.get('#event-name-error').should('contain.text', 'Informe o nome do evento.');
    cy.get('#event-address-error').should(
      'contain.text',
      'Informe o endereço do evento.'
    );
    cy.get('#event-date-error').should('contain.text', 'Informe a data do evento.');
    cy.get('.cfp-field-error').should('have.length', 3);
    cy.get('#event-name').should('have.attr', 'aria-invalid', 'true');

    // 2. Name filled in: its message goes away, the others remain.
    cy.get('#event-name').type('Meetup de Testes');
    cy.get('form.cfp-form').submit();
    cy.get('#event-name-error').should('not.exist');
    cy.get('#event-name').should('not.have.attr', 'aria-invalid');
    cy.get('.cfp-field-error').should('have.length', 2);

    // 3. Address filled in: only the date is still missing.
    cy.get('#event-address').type('Av. Ipiranga, 6681 - Porto Alegre');
    cy.get('form.cfp-form').submit();
    cy.get('#event-address-error').should('not.exist');
    cy.get('.cfp-field-error')
      .should('have.length', 1)
      .and('contain.text', 'Informe a data do evento.');

    // 4. A past date, typed past the datepicker's minimum.
    cy.get('#event-date').type('2020-01-01');
    cy.get('form.cfp-form').submit();
    cy.get('.cfp-field-error')
      .should('have.length', 1)
      .and('contain.text', 'Escolha uma data a partir de amanhã.');
    cy.get('#event-date').should('have.attr', 'aria-invalid', 'true');

    // No invalid attempt reaches the API or reports success.
    cy.get('button.cfp-button-primary').should('be.disabled');
    cy.get('.cfp-message-success').should('not.exist');
    cy.get('@registerEvent.all').should('have.length', 0);
  });
});
