// just a simple shared variable
let credits = 0;

// getter and setter functions
export const setCredits = (value: number) => { credits = value; }
export const getCredits = () => credits;
