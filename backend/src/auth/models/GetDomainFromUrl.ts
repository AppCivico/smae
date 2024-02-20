export function GetDomainFromUrl(url: string): string {
    const urlObject = new URL(url);

    return urlObject.hostname;
}
