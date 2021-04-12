# covid-vaccine-monitor

This is a very crude node script which does the following:
- Uses puppeteer to navigate to Pharmaca website
- Select covid vaccine
- Take a screenshot
- Compare that screenshot to one from 60 seconds ago
- If screenshots are different, assume that new vaccines are available, and send a slack message to notify me.

Some known issues:
- Sometimes it takes vaccines a while to load, so wait 5 seconds before taking screenshot
