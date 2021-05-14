export const getRandomString = (length: number = 3, characters: string = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!$%&/=?#+-<>()[]{}.") => {
    let randomString = "";

    for(let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        randomString += characters[randomIndex];
    }
    
    return randomString;
}