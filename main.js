// main.js
const puppeteer = require('puppeteer');
const { pressKey, forms } = require('./keyboardActions');

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Mở một trang ví dụ
    await page.goto('https://www.facebook.com/');

    // Ví dụ: nhấn lần lượt các phím "H", "e", "l", "l", "o" vào input có selector là '#inputId'
    // await pressKey(page, '#email', 'press', 'Hello', 200);

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

    await forms(page, {
        selectorType: 'css',
        selector: '#email', // Thay thế selector của bạn cho email field
        value: 'example@example.com',
        isMultiple: false, // Chỉ xử lý một phần tử
        waitForSelector: true,
        getFormValue: false,
        formType: 'text',
        textFieldOptions: {
            clearFormValue: true, // Xóa giá trị hiện tại trước khi nhập
            typingDelay: 100 // Delay giữa các ký tự
        }
    });

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

    await browser.close();
})();
