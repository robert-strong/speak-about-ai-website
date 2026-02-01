declare module 'mammoth' {
  interface ConvertOptions {
    arrayBuffer?: ArrayBuffer
    path?: string
  }

  interface ConvertResult {
    value: string
    messages: any[]
  }

  export function convertToHtml(options: ConvertOptions): Promise<ConvertResult>
  export function convertToMarkdown(options: ConvertOptions): Promise<ConvertResult>
  export function extractRawText(options: ConvertOptions): Promise<ConvertResult>
}