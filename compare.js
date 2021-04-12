// This script will navigate to a web page (using puppeteer, a headless Chromium API) and take a screenshot.
// It then uses resemblejs to compare the screenshot to old screenshot. If the screenshots are >1% different,
// send a slack message to let folks know.

const puppeteer = require('puppeteer')
const fs = require('fs')
const compareImages = require('resemblejs/compareImages')
const fsz = require('mz/fs')
const sendMessage = require('./slack.js')
const schedule = require('node-schedule')
// Customize this URL to watch a different site.
const siteName = 'https://pharmaca.as.me/menlopark'

// Renames the screenshot taken 60 seconds ago from "new" to "prev"
function cleanupPics(vaccineType = 'jj') {
  try {
    if (fs.existsSync(`./screenshots/${vaccineType}new.png`)) {
      fs.rename(
        `./screenshots/${vaccineType}new.png`,
        `./screenshots/${vaccineType}prev.png`,
        (err) => {
          console.log(err)
        },
      )
    }
  } catch (err) {
    console.error(err)
  }
}

// Diffs website screenshots and sends Slack msg if different
async function getDiff(vaccineType = 'jj') {
  const options = {
    output: {
      errorColor: {
        red: 255,
        green: 0,
        blue: 0,
      },
      errorType: 'diffOnly',
      largeImageThreshold: 1200,
      useCrossOrigin: false,
      outputDiff: true,
    },
    scaleToSameSize: true,
    ignore: 'antialiasing',
  }
  const data = await compareImages(
    await fsz.readFile(`./screenshots/${vaccineType}new.png`),
    await fsz.readFile(`./screenshots/${vaccineType}prev.png`),
    options,
  )
  console.log('Current diff % is:' + data.misMatchPercentage)
  // If greater than 1 percent different, send an alert!
  if (data.misMatchPercentage > 0.01) {
    if (vaccineType == 'jj') {
      await sendMessage(
        'New J&J Vaccine found!! Head to https://pharmaca.as.me/menlopark ASAP',
      )
    } else {
      await sendMessage(
        'New Moderna Vaccine found! Head to https://pharmaca.as.me/menlopark ASAP',
      )
    }
  }
  // Write diff if desired
  // await fsz.writeFile(`./screenshots/diff.png`, data.getBuffer())
}

async function main() {
  let time = new Date().toLocaleString()
  console.log('Starting script at ' + time)

  // Navigate to website
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  page.setViewport({ width: 1000, height: 2500, deviceScaleFactor: 1 })
  await page.goto(`${siteName}`, { waitUntil: 'networkidle0' })

  // Click J&J
  try {
    await page.click('div[data-qa="appointment-21702064-select"]')
  } catch (e) {
    console.log('J&J not appearing, exiting')
    return
  }
  await page.waitFor(5000)

  // Cleanup old J&J pics
  cleanupPics('jj')

  //Take a new J&J screenshot
  await page.screenshot({ path: './screenshots/jjnew.png' })

  // Diff and send a slack msg if needed
  try {
    if (
      fs.existsSync(`./screenshots/jjnew.png`) &&
      fs.existsSync(`./screenshots/jjprev.png`)
    ) {
      getDiff('jj')
    }
  } catch (err) {
    console.error(err)
  }

  // Reload and click Moderna
  await page.goto(`${siteName}`, { waitUntil: 'networkidle0' })
  try {
    await page.click('div[data-qa="appointment-20580919-select')
  } catch (e) {
    console.log('Moderna not appearing, exiting')
    return
  }
  await page.waitFor(5000)

  // Cleanup old Moderna pics
  cleanupPics('moderna')

  //Take a new moderna screenshot
  await page.screenshot({ path: './screenshots/modernanew.png' })

  // Diff and send a slack msg if needed
  try {
    if (
      fs.existsSync(`./screenshots/modernanew.png`) &&
      fs.existsSync(`./screenshots/modernaprev.png`)
    ) {
      getDiff('moderna')
    }
  } catch (err) {
    console.error(err)
  }

  browser.close()
}

//schedule main every minute
var j = schedule.scheduleJob('*/1 * * * *', main)
