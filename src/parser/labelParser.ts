export function extractLabels(text: string): { labels: string[]; remainingText: string } {
  const labels: string[] = []
  const labelRegex = /#([\w-]+)/g
  let match: RegExpExecArray | null

  while ((match = labelRegex.exec(text)) !== null) {
    labels.push(match[1].toLowerCase())
  }

  const remainingText = text.replace(/#[\w-]+/g, '').replace(/\s+/g, ' ').trim()
  return { labels, remainingText }
}

export function normalizeLabelName(name: string): string {
  return name.toLowerCase().replace(/^#/, '').trim()
}
