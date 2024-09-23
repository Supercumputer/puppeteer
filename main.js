// main.js
const puppeteer = require('puppeteer');
const { pressKey, forms, mouseClick, mouseMove, hoverElement, ScrollElement, xpathCoordinates, switchFrame, attributeValue, getText, link, createElement } = require('./keyboardActions');
const installMouseHelper = require('./mousehelper.js');

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await installMouseHelper(page);
    // Mở một trang ví dụ
    await page.goto('https://www.facebook.com/');
    // await page.goto('https://www.google.com/search?q=google+number&sca_esv=f28b3b0bae9cc4f2&sca_upv=1&biw=800&bih=600&ei=rOXwZqLYOKTi2roP0ZGwiAw&ved=0ahUKEwii3sfklNiIAxUksVYBHdEIDME4ChDh1QMIDw&uact=5&oq=google+number&gs_lp=Egxnd3Mtd2l6LXNlcnAiDWdvb2dsZSBudW1iZXIyBRAAGIAEMgYQABgWGB4yBhAAGBYYHjIGEAAYFhgeMgYQABgWGB4yBhAAGBYYHjIGEAAYFhgeMgYQABgWGB4yBhAAGBYYHjIGEAAYFhgeSMQYUNELWMMXcAF4AJABAJgBYKAB1wWqAQE4uAEDyAEA-AEBmAIIoAKUBcICChAAGLADGNYEGEfCAg0QABiABBiwAxhDGIoFwgITEC4YgAQYsAMYQxjIAxiKBdgBAcICCBAAGIAEGLEDwgIEEAAYA8ICCxAAGIAEGLEDGIMBmAMAiAYBkAYMugYECAEYCJIHATigB_ky&sclient=gws-wiz-serp');
    // await page.goto('https://coccoc.com/search?query=YouTube');
    // await page.goto('https://www.w3schools.com/html/tryit.asp?filename=tryhtml_default');

    let result = await createElement(
        page,                // Puppeteer page instance
        'css',               // Tìm bằng CSS selector
        '._8eso',              // Selector để tìm phần tử <head> (chèn thẻ <style> vào đây)
        { waitForSelector: true, selectorTimeout: 5000 },  // Tùy chọn chờ phần tử xuất hiện
        'as last child',     // Chèn vào cuối thẻ <head>
        '<style> ._8eso { color: red !important; } </style>'  // Nội dung CSS sẽ được chèn vào <head>
    );

    // const jsContent = `
    //     <script>
    //         console.log('Hello from injected script!');
    //         document.body.style.backGround = 'red' !important;
    //     </script>
    // `;

    // let result = await createElement(
    //     page,                // Puppeteer page instance
    //     'css',               // Tìm bằng CSS selector
    //     'head',              // Selector để tìm phần tử <head> (chèn thẻ <style> vào đây)
    //     { waitForSelector: true, selectorTimeout: 5000 },  // Tùy chọn chờ phần tử xuất hiện
    //     'as last child',     // Chèn vào cuối thẻ <head>
    //     jsContent  // Nội dung CSS sẽ được chèn vào <head>
    // );

    // const result = await createElement(
    //     page, // Đối tượng trang Puppeteer
    //     'xpath', // Sử dụng XPath selector để chọn phần tử
    //     '//*[@id="content"]/div/div/div/div[1]/h2', // Chọn phần tử body bằng XPath
    //     { waitForSelector: true, selectorTimeout: 5000 }, // Tùy chọn chờ phần tử
    //     'as last child', // Chèn phần tử mới là con cuối cùng
    //     '<h2>Hello haha World</h2>' // Nội dung HTML chèn vào
    // );
    // console.log(result);

    // const text = await getText(page, 'css', '.g:nth-child(5) .VwiC3b > span', {
    //     multiple: false,           // Nếu bạn muốn tìm nhiều phần tử
    //     markElement: true,        // Đánh dấu phần tử
    //     waitForSelector: true,    // Đợi phần tử xuất hiện
    //     selectorTimeout: 5000,    // Thời gian chờ
    //     includeHtmlTag: false,    // Không lấy cả thẻ HTML
    //     useTextContent: false      // Lấy textContent thay vì innerText
    // }, '\\d+', '', '');

    // console.log('\x1b[31m%s\x1b[0m', text);

    // const text = await getText(page, 'xpath', '//*[@id="content"]/div/div/div/div[1]/h2', {
    //     multiple: true,           // Nếu bạn muốn tìm nhiều phần tử
    //     markElement: true,        // Đánh dấu phần tử
    //     waitForSelector: true,    // Đợi phần tử xuất hiện
    //     selectorTimeout: 5000,    // Thời gian chờ
    //     includeHtmlTag: false,    // Không lấy cả thẻ HTML
    //     useTextContent: false      // Lấy textContent thay vì innerText
    // }, null, '', '');

    // console.log('\x1b[31m%s\x1b[0m', text);

    // const links = await link(page, 'css', '.LC20lb.MBeuO.DKV0Md', {
    //     markElement: true,        // Đánh dấu phần tử
    //     waitForSelector: true,    // Đợi phần tử xuất hiện
    //     selectorTimeout: 5000,      // Thời gian chờ
    //     openLinkInNewTab: false
    // });

    // console.log('\x1b[31m%s\x1b[0m', links);


    //check tọa độ cụ thể:
    // const coordinates = await xpathCoordinates(page, '//*[@id="root"]/div/div[1]/div[4]/div/div/div[1]/div[1]/a/div');
    // console.log(coordinates);

    // await pressKey(page, '#email', 'press', 'your-email@example.com', 200);
    // await pressKey(page, '#pass', 'press', 'your-password', 200);
    // // // Ví dụ: nhập cả chuỗi "Hello World" cùng lúc vào input có selector là '#inputId'
    // // await pressKey(page, '#email', 'pressMultiple', 'Hello World', 200);

    // await forms(page, {
    //     selectorType: 'css',
    //     selector: '#email', // Thay thế bằng selector của bạn
    //     value: 'Puppeteer Test',
    //     isMultiple: true, // Process multiple elements
    //     waitForSelector: true,
    //     getFormValue: false,
    //     formType: 'text',
    //     textFieldOptions: {
    //         clearFormValue: true,
    //         typingDelay: 100
    //     }
    // });

    // await forms(page, {
    //     selectorType: 'css',
    //     selector: '#pass', // Thay thế bằng selector của bạn
    //     value: 'Puppeteer Test',
    //     isMultiple: true, // Process multiple elements
    //     waitForSelector: true,
    //     getFormValue: false,
    //     formType: 'text',
    //     textFieldOptions: {
    //         clearFormValue: true,
    //         typingDelay: 100
    //     }
    // });

    // await forms(page, {
    //     selectorType: 'xpath',
    //     selector: '//*[@id="pass"]', // Thay thế bằng selector của bạn
    //     value: 'Puppeteer Test',
    //     isMultiple: false, // Process multiple elements
    //     waitForSelector: true,
    //     getFormValue: false,
    //     formType: 'text',
    //     textFieldOptions: {
    //         clearFormValue: true,
    //         typingDelay: 100
    //     }
    // });

    // await forms(page, {
    //     selectorType: 'css',
    //     selector: '#email', // Thay thế selector của bạn cho email field
    //     value: 'example@example.com',
    //     isMultiple: false, // Chỉ xử lý một phần tử
    //     waitForSelector: true,
    //     getFormValue: false,
    //     formType: 'text',
    //     textFieldOptions: {
    //         clearFormValue: true, // Xóa giá trị hiện tại trước khi nhập
    //         typingDelay: 100 // Delay giữa các ký tự
    //     }
    // });

    // await forms(page, {
    //     selectorType: 'css',
    //     selector: '#email', // Thay thế selector bằng dropdown nếu email là dropdown
    //     value: 'OptionValue', // Giá trị để chọn
    //     isMultiple: false, // Xử lý một phần tử
    //     waitForSelector: true,
    //     getFormValue: false,
    //     formType: 'text',
    //     selectOptions: {
    //         byValue: true, // Chọn bằng giá trị
    //         clearFormValue: true // Xóa giá trị hiện tại trước khi chọn
    //     }
    // });

    // // Di chuyển chuột đến một tọa độ cụ thể
    // await mouseMove(page, 100, 300);
    // await mouseMove(page, null, null, 'css', '._8eso');
    // await mouseMove(page, null, null, 'xpath', '//*[@id="content"]/div/div/div/div[1]/h2');

    // await mouseMove(page, 'coordinates', { x: 100, y: 300 }, 5000, true);
    // await mouseMove(page, 'css', { selectorValue: '.url-ZI6q6' }, 5000, true, true);
    // await mouseMove(page, 'xpath', { selectorValue: '//*[@id="root"]/div/div[1]/div[4]/div/div/div[1]/div[1]/a/div' }, 5000, true, true);

    // // // Click chuột vào phần tử cụ thể
    // await mouseClick(page, 500, 500);
    // await mouseClick(page, null, null, 'css', '.fb_logo._8ilh.img');
    // await mouseClick(page, null, null, 'css', '.url-AQP5U.default-xCOWf');
    // await mouseClick(page, null, null, 'xpath', '//*[@id="content"]/div/div/div/div[1]/h2');

    // await mouseClick(page, 'coordinates', { x: 100, y: 100 }, 5000, true);
    // await mouseClick(page, 'css', { selectorValue: '.url-ZI6q6' }, 5000, true, true);
    // await mouseClick(page, 'xpath', { selectorValue: '//*[@id="root"]/div/div[1]/div[4]/div/div/div[1]/div[1]/a/span[1]' }, 5000, true, true);

    // const result1 = await hoverElement(page, 'xpath', './/*[@id="content"]/div/div/div/div[1]/h2', {
    //     multiple: false,
    //     markElement: true,
    //     waitForSelector: true,
    //     selectorTimeout: 20000
    // });

    // console.log(result1);

    // const result2 = await hoverElement(page, 'css', '._42ft._4jy0._6lti._4jy6._4jy2.selected._51sy', {
    //     multiple: false,
    //     markElement: true,
    //     waitForSelector: true,
    //     selectorTimeout: 20000
    // });
    // console.log(result2);

    // const result3 = await hoverElement(page, 'css', '.fb_logo._8ilh.img', {
    //     multiple: false,
    //     markElement: true,
    //     waitForSelector: true,
    //     selectorTimeout: 20000
    // });
    // console.log(result3);

    // let result4 = await ScrollElement(page, 'css', '._8esh', {
    //     multiple: false,
    //     markElement: true,
    //     waitForSelector: true,
    //     selectorTimeout: 100,
    //     scrollHorizontal: 100,
    //     scrollVertical: 200,
    //     scrollIntoView: true,
    //     smoothScroll: true,
    //     incrementHorizontal: false,
    //     incrementVertical: false
    // });

    // console.log(result4);

    // let result5 = await ScrollElement(page, 'xpath', '//*[@id="root"]/div/div[1]/div[2]/div[5]', {
    //     multiple: false,
    //     markElement: true,
    //     waitForSelector: false,
    //     selectorTimeout: 20000,
    //     scrollHorizontal: 0,
    //     scrollVertical: 10000,
    //     scrollIntoView: false,
    //     smoothScroll: true,
    //     incrementHorizontal: false,
    //     incrementVertical: false
    // });

    // console.log(result5);

    // let result = await switchFrame(page, 'main-window');
    // console.log(result);  // success

    // let result = await switchFrame(page, 'iframe', 'css', '#iframeResult');
    // console.log(result);  // success

    // let result = await switchFrame(page, 'iframe', 'xpath', '//*[@id="iframeResult"]');
    // console.log(result);  // success

    // let result8 = await attributeValue(page, 'css', '._42ft._4jy0._6lth._4jy6._4jy1.selected._51sy', {
    //     markElement: true,
    //     waitForSelector: true,
    //     waitSelectorTimeout: 20000,
    //     multiple: true,
    //     action: 'set',
    //     attributeName: 'class',
    //     attributeValue: 'new-class'
    // })

    // console.log(result8);

    // let result = await attributeValue(page, 'css', '.url-ZI6q6', {
    //     markElement: true,
    //     waitForSelector: true,
    //     waitSelectorTimeout: 20000,
    //     multiple: true,
    //     action: 'get',
    //     attributeName: 'class'
    // })

    // console.log(result);

    // let result = await attributeValue(page, 'xpath', '//*[@id="root"]/div/div[1]/div[4]/div/div/div[1]/div[1]/a/div', {
    //     markElement: true,
    //     waitForSelector: true,
    //     waitSelectorTimeout: 20000,
    //     multiple: true,
    //     action: 'get',
    //     attributeName: 'class'
    // })

    // console.log(result);


    // await browser.close();
})();
