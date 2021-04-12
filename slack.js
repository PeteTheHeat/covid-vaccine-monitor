const fetch = require('node-fetch')

// Add a slack token here....

async function sendMessage(text = 'Vaccine changed') {
  console.log('Sending')
  let payload = {
    channel: 'bot-messages',
    text: text,
  }
  fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
      Accept: 'application/json',
    },
  })
    .then((res) => {
      console.log('Done: ' + JSON.stringify(res))
      if (!res.ok) {
        throw new Error(`Server error ${res.status}`)
      }

      return res.json()
    })
    .catch((error) => {
      console.log(error)
    })
}

module.exports = sendMessage
