import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

  await page.goto('http://localhost:5173/');
  await new Promise(r => setTimeout(r, 2000));
  
  const content = await page.content();
  if (content.includes('ProfileSetup')) {
     console.log("On Profile Setup");
  }

  // Type in the form
  await page.type('#name', 'Alice');
  await page.type('#grade', '5th');
  await page.type('#school', 'School');
  
  await page.click('button[type="submit"]');
  console.log("Clicked submit.");

  await new Promise(r => setTimeout(r, 2000));

  const errorText = await page.evaluate(() => {
    const err = document.querySelector('.bg-red-50');
    return err ? err.innerText : 'NO Error visible';
  });

  console.log("Error inside ProfileSetup:", errorText);

  // Check if we moved to main app
  const url = await page.url();
  console.log("Current URL after submit:", url);
  const body = await page.evaluate(() => document.body.innerText);
  console.log("Page text excerpt:", body.substring(0, 300));

  await browser.close();
})();
