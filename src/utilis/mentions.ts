export const parseMentions = (text: string) => {
  return text.replace(/@(\w+)/g, '<a href="/profile/$1">@$1</a>')
}