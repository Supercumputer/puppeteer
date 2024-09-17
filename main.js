// main.js
const puppeteer = require('puppeteer');
const { pressKey, forms, mouseClick, mouseMove } = require('./keyboardActions');
const installMouseHelper = require('./mousehelper.js');

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    installMouseHelper(page);
    // Mở một trang ví dụ
    await page.goto('https://www.facebook.com/');

    // Lấy tọa độ của ô email và password
    const emailCoordinates = await page.evaluate(() => {
        const element = document.querySelector('#email');
        const rect = element.getBoundingClientRect();
        return { x: rect.x, y: rect.y };
    });

    const passCoordinates = await page.evaluate(() => {
        const element = document.querySelector('#pass');
        const rect = element.getBoundingClientRect();
        return { x: rect.x, y: rect.y };
    });

    // Nhập email và password
    await page.mouse.move(emailCoordinates.x, emailCoordinates.y);
    await page.mouse.click(emailCoordinates.x, emailCoordinates.y);
    await pressKey(page, '#email', 'press', 'your-email@example.com', 200);

    await page.mouse.move(passCoordinates.x, passCoordinates.y);
    await page.mouse.click(passCoordinates.x, passCoordinates.y);
    await pressKey(page, '#pass', 'press', 'your-password', 200);

    // Ví dụ: nhập cả chuỗi "Hello World" cùng lúc vào input có selector là '#inputId'
    // await pressKey(page, '#email', 'pressMultiple', 'Hello World', 200);

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
    //     formType: 'select',
    //     selectOptions: {
    //         byValue: true, // Chọn bằng giá trị
    //         clearFormValue: true // Xóa giá trị hiện tại trước khi chọn
    //     }
    // });

    // Di chuyển chuột đến một tọa độ cụ thể
    // await mouseMove(page, 200, 300);
    // await mouseMove(page, null, null, '.style-scope.ytd-logo');

    // Click chuột vào phần tử cụ thể
    // await mouseClick(page, null, null, '.style-scope.ytd-logo');

    await browser.close();
})();
