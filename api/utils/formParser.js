export async function fetchAndParseForm(formUrl) {
  try {
    const res = await fetch(formUrl)
    if (!res.ok) throw new Error(`Failed to fetch form: ${res.status} ${res.statusText}`)
    const html = await res.text()

    const match = html.match(/var FB_PUBLIC_LOAD_DATA_ = (\[.*?\]);\n/)
    if (!match) {
      throw new Error("Could not find form data in the page.")
    }

    const data = JSON.parse(match[1])
    const formTitle = data[3] || 'Daily Questionnaire'
    const questionsData = data[1][1]
    
    const questions = []
    for (const q of questionsData) {
      if (!q[4]) continue // skip sections/descriptions

      // q[0] is ID, q[1] is Title, q[3] is Type (0=Short Answer, 2=Multiple Choice, etc)
      // q[4][0][0] is the entry ID
      const question = {
        id: q[0].toString(),
        title: q[1],
        type: q[3],
        entryId: q[4][0][0].toString(),
        options: q[4][0][1] && q[4][0].length > 1 ? q[4][0][1].map(opt => opt[0]) : null
      }
      questions.push(question)
    }
    
    // Convert viewform URL to formResponse URL
    const submitUrl = formUrl.replace('/viewform', '/formResponse').split('?')[0]

    return {
      title: formTitle,
      submitUrl,
      questions
    }
  } catch (err) {
    console.error("[formParser] Error:", err.message)
    return null
  }
}
