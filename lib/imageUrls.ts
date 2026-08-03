export function normalizeListingImageUrl(url: string) {
  return url
    .replace(/listing-ph(?:%2520|%20|\s)otos/g, 'listing-photos')
    .replace(/listing-ph%2520otos/g, 'listing-photos');
}

export function normalizeListingImageUrls(images?: string[] | null) {
  return (images ?? []).map((image) => normalizeListingImageUrl(image));
}
