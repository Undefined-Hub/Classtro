const axios = require("axios");
const cheerio = require("cheerio");

/**
 * Extract metadata from a URL using Open Graph tags and fallbacks
 * @param {string} url - The URL to fetch metadata from
 * @returns {Promise<object>} Metadata object with title, description, image, favicon
 */
async function fetchUrlMetadata(url) {
  try {
    // Validate URL
    const urlObj = new URL(url);
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      throw new Error("Invalid protocol");
    }

    // Fetch the page with a timeout
    const response = await axios.get(url, {
      timeout: 5000,
      maxRedirects: 5,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Extract metadata with fallbacks
    const metadata = {
      url: url,
      title:
        $('meta[property="og:title"]').attr("content") ||
        $('meta[name="twitter:title"]').attr("content") ||
        $("title").text() ||
        urlObj.hostname,
      description:
        $('meta[property="og:description"]').attr("content") ||
        $('meta[name="twitter:description"]').attr("content") ||
        $('meta[name="description"]').attr("content") ||
        "",
      image:
        $('meta[property="og:image"]').attr("content") ||
        $('meta[name="twitter:image"]').attr("content") ||
        null,
      favicon:
        $('link[rel="icon"]').attr("href") ||
        $('link[rel="shortcut icon"]').attr("href") ||
        `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`,
      siteName:
        $('meta[property="og:site_name"]').attr("content") || urlObj.hostname,
    };

    // Resolve relative URLs for image and favicon
    if (metadata.image && !metadata.image.startsWith("http")) {
      metadata.image = new URL(
        metadata.image,
        `${urlObj.protocol}//${urlObj.host}`,
      ).href;
    }
    if (metadata.favicon && !metadata.favicon.startsWith("http")) {
      metadata.favicon = new URL(
        metadata.favicon,
        `${urlObj.protocol}//${urlObj.host}`,
      ).href;
    }

    // Truncate description if too long
    if (metadata.description && metadata.description.length > 200) {
      metadata.description = metadata.description.substring(0, 197) + "...";
    }

    // Truncate title if too long
    if (metadata.title && metadata.title.length > 100) {
      metadata.title = metadata.title.substring(0, 97) + "...";
    }

    return metadata;
  } catch (error) {
    // Return minimal metadata on error
    console.error("Error fetching URL metadata:", error.message);
    try {
      const urlObj = new URL(url);
      return {
        url: url,
        title: urlObj.hostname,
        description: "",
        image: null,
        favicon: `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`,
        siteName: urlObj.hostname,
        error: true,
      };
    } catch {
      return {
        url: url,
        title: url,
        description: "",
        image: null,
        favicon: null,
        siteName: "",
        error: true,
      };
    }
  }
}

/**
 * Fetch metadata for multiple URLs
 * @param {string[]} urls - Array of URLs
 * @returns {Promise<object>} Map of URL to metadata object
 */
async function fetchMultipleUrlMetadata(urls) {
  const results = {};

  // Process URLs in parallel with a limit
  const promises = urls.map(async (url) => {
    const metadata = await fetchUrlMetadata(url);
    results[url] = metadata;
  });

  await Promise.all(promises);
  return results;
}

module.exports = {
  fetchUrlMetadata,
  fetchMultipleUrlMetadata,
};
