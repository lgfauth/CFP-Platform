describe('Cadastro de palestra', () => {
  beforeEach(() => {
    cy.visit('/palestras/nova');
    cy.get('h1.cfp-title').should('have.text', 'Proponha sua palestra');
  });

  it('cadastra uma palestra e a exibe no Dashboard', () => {
    // Unique values keep talks left in the API's memory by earlier runs from
    // producing a false positive.
    const suffix = Date.now();
    const talkTitle = `Testes E2E com Cypress ${suffix}`;
    const speakerName = `Pessoa Palestrante ${suffix}`;
    const speakerEmail = `e2e-${suffix}@example.com`;

    cy.get('#speaker-name').type(speakerName);
    cy.get('#speaker-email').type(speakerEmail);
    cy.get('#talk-title').type(talkTitle);

    cy.get('button.cfp-button-primary')
      .should('be.enabled')
      .and('contain.text', 'Enviar proposta')
      .click();

    cy.get('.cfp-message-success').should(
      'contain.text',
      'Proposta enviada com sucesso. Obrigado por contribuir!'
    );

    cy.contains('nav.cfp-nav a', 'Dashboard').click();
    cy.location('pathname').should('eq', '/');

    cy.contains('#speakers-section tbody tr', talkTitle).within(() => {
      cy.contains('td', speakerName).should('be.visible');
      cy.contains('td', speakerEmail).should('be.visible');
      cy.contains('td', 'Não').should('be.visible');
    });
  });

  it('exibe as mensagens de validação a cada tentativa de envio', () => {
    cy.intercept('POST', '/api/speakers').as('submitSpeaker');

    // The submit button stays disabled while the form is invalid, so the
    // attempt is made on the form itself, as pressing Enter in a field would.
    cy.get('button.cfp-button-primary').should('be.disabled');

    // 1. Empty form: every required field reports its own message.
    cy.get('form.cfp-form').submit();
    cy.get('#speaker-name-error').should('contain.text', 'Informe seu nome.');
    cy.get('#speaker-email-error').should('contain.text', 'Informe seu email.');
    cy.get('#talk-title-error').should(
      'contain.text',
      'Informe o título da palestra.'
    );
    cy.get('.cfp-field-error').should('have.length', 3);
    cy.get('#speaker-name').should('have.attr', 'aria-invalid', 'true');

    // 2. Name filled in: its message goes away, the others remain.
    cy.get('#speaker-name').type('Pessoa Palestrante');
    cy.get('form.cfp-form').submit();
    cy.get('#speaker-name-error').should('not.exist');
    cy.get('#speaker-name').should('not.have.attr', 'aria-invalid');
    cy.get('#speaker-email-error').should('contain.text', 'Informe seu email.');
    cy.get('.cfp-field-error').should('have.length', 2);

    // 3. Email in an invalid format.
    cy.get('#speaker-email').type('email-invalido');
    cy.get('form.cfp-form').submit();
    cy.get('#speaker-email-error').should(
      'contain.text',
      'Informe um email válido.'
    );
    cy.get('.cfp-field-error').should('have.length', 2);

    // 4. Valid email: only the talk title is still missing.
    cy.get('#speaker-email').clear().type('pessoa@example.com');
    cy.get('form.cfp-form').submit();
    cy.get('#speaker-email-error').should('not.exist');
    cy.get('.cfp-field-error')
      .should('have.length', 1)
      .and('contain.text', 'Informe o título da palestra.');

    // No invalid attempt reaches the API or reports success.
    cy.get('button.cfp-button-primary').should('be.disabled');
    cy.get('.cfp-message-success').should('not.exist');
    cy.get('@submitSpeaker.all').should('have.length', 0);
  });
});
