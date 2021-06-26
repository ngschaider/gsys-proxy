import cookie from "cookie";

export const replaceCookie = (original: string, name: string, value: string) => {
    const input = cookie.parse(original);
    input[name] = value;

    return Object.entries(input).map(([name, value]) => {
        return name + "=" + value;
    }).join("; ");
}