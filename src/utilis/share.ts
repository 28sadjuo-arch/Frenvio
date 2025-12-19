export const shareToTwitter = (text: string) => {
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank')
}

export const shareToFacebook = (url: string) => {
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
}