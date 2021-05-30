enum ResponseMessage {
    INVALID_TOKEN = "Token ungültig!",
    NOT_ENOUGH_PARAMETERS = "Not enough parameters!",
    LOGIN_OKAY = "Anmeldung erfolgreich!",
    REGISTER_OKAY = "Registrierung erfolgreich!",
    WRONG_CREDENTIALS = "Benutzername oder Passwort falsch!",
    PASSWORDS_NOT_MATCHING = "Passwörter stimmen nicht überein!",
    WRONG_EMAIL_FORMAT = "E-Mail Adresse scheint nicht richtig zu sein!",
    USERNAME_TAKEN = "Benutzername bereits vergeben!",
    EMAIL_TAKEN = "Benutzer mit dieser E-Mail Adresse bereits vorhanden!",
    LOGOUT_OKAY = "Abmeldung erfolgreich!",
    NOT_ENOUGH_PERMISSIONS = "Dazu fehlt Ihnen die Berechtigung.",
    RESOURCE_NOT_FOUND = "Angeforderte Resource nicht gefunden.",
}

export default ResponseMessage;