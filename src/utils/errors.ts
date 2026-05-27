export const getErrorMessage = (error: any, defaultMessage: string = "Ocurrió un error"): string => {
  if (error?.response?.data) {
    const data = error.response.data
    if (typeof data === "string") {
      return data
    }
    if (data.error) {
      return data.error
    }
    if (data.errors && Array.isArray(data.errors)) {
      return data.errors.map((err: any) => err.msg).join("\n")
    }
    if (data.message) {
      return data.message
    }
  }
  return error?.message || defaultMessage
}
