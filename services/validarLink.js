export default function isTikTokUrl(url) {
    // Expresión regular para verificar si la URL contiene "tiktok.com"
    const tikTokRegex = /(?:https?:\/\/)?(?:www\.)?tiktok\.com/i;

    // Verificar si la URL coincide con la expresión regular
    return tikTokRegex.test(url);
}
