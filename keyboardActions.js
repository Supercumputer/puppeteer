// keyboardActions.js
async function pressKey(page, selector, action, key, pressTime = 0) {
    try {
        // Đợi cho đến khi phần tử xuất hiện trên trang
        await page.waitForSelector(selector);

        const element = await page.$(selector);

        if (!element) {
            throw new Error(`No element found for selector: ${selector}`);
        }

        await element.focus();

        if (action === 'press') {
            for (let char of key) {
                await page.keyboard.press(char);
                if (pressTime > 0) {
                    await new Promise(r => setTimeout(r, pressTime));  // Thay thế waitForTimeout
                }
            }
        } else if (action === 'pressMultiple') {
            await page.keyboard.type(key);
        }
    } catch (error) {
        console.error('Error pressing keys:', error);
    }
}

async function forms(page, {
    selectorType = 'css', // 'css' or 'xpath'
    selector = '', // CSS or XPath selector
    value = '', // Value to input or select
    isMultiple = false, // Multiple elements
    markElement = false, // Highlight element
    waitForSelector = false, // Wait for selector
    selectorTimeout = 5000, // Timeout for waiting selector
    getFormValue = true, // Get form value
    formType = 'text', // 'text', 'select', 'radio', 'checkbox'
    textFieldOptions = {
        clearFormValue: true, // Clear form before input
        typingDelay: 0 // Typing delay in ms
    },
    selectOptions = {
        byValue: true, // Select by value or position
        clearFormValue: true, // Clear form before selection
        optionPosition: 1, // Position of the option if by position (default = 1)
    },
    radioOptions = {
        selected: true // Default selected for radio
    },
    checkboxOptions = {
        selected: true // Default selected for checkbox
    }
}) {
    // Find elements by selector type (CSS or XPath)
    let elements;
    try {
        if (selectorType === 'css') {
            if (waitForSelector) {
                await page.waitForSelector(selector, { timeout: selectorTimeout });
            }
            elements = await page.$$(selector);
        } else if (selectorType === 'xpath') {
            if (waitForSelector) {
                await page.waitForXPath(selector, { timeout: selectorTimeout });
            }
            elements = await page.$x(selector);
        } else {
            throw new Error(`Unsupported selector type: ${selectorType}`);
        }
    } catch (error) {
        console.error('Error finding elements:', error.message);
        return;
    }

    if (isMultiple && elements.length === 0) {
        console.error(`No elements found for selector: ${selector}`);
        return;
    }

    // Iterate over each element if isMultiple is true
    const processElement = async (element) => {
        try {
            if (markElement) {
                await page.evaluate(el => el.style.border = '2px solid red', element);
            }

            if (getFormValue) {
                const formValue = await page.evaluate(el => el.value, element);
                console.log('Form value:', formValue);
            } else {
                switch (formType) {
                    case 'text':
                        if (textFieldOptions.clearFormValue) {
                            await element.click({ clickCount: 3 });
                            await element.press('Backspace');
                        }
                        await element.type(value, { delay: textFieldOptions.typingDelay });
                        break;

                    case 'select':
                        if (selectOptions.clearFormValue) {
                            await element.select(''); // Clear selection
                        }
                        if (selectOptions.byValue) {
                            await element.select(value); // Select by value
                        } else {
                            if (value === 'first') {
                                await element.select(await element.evaluate(el => el.querySelector('option').value));
                            } else if (value === 'last') {
                                const options = await element.$$('option');
                                const lastOption = options[options.length - 1];
                                await lastOption.evaluate(option => option.selected = true);
                            } else {
                                const options = await element.$$('option');
                                const option = options[selectOptions.optionPosition - 1];
                                await option.evaluate(option => option.selected = true);
                            }
                        }
                        break;

                    case 'radio':
                        if (radioOptions.selected) {
                            await element.click();
                        }
                        break;

                    case 'checkbox':
                        const isChecked = await page.evaluate(el => el.checked, element);
                        if (isChecked !== checkboxOptions.selected) {
                            await element.click();
                        }
                        break;

                    default:
                        throw new Error(`Invalid form type: ${formType}`);
                }
            }
        } catch (error) {
            console.error(`Error processing element with selector ${selector}:`, error.message);
        }
    };

    try {
        if (isMultiple) {
            for (const element of elements) {
                await processElement(element);
            }
        } else {
            if (elements.length > 0) {
                await processElement(elements[0]);
            } else {
                console.error(`Element not found: ${selector}`);
            }
        }
    } catch (error) {
        console.error('Error processing elements:', error.message);
    }
}

async function mouseMove(page, x = null, y = null, element = null, timeout = 5000) {
    try {
        if (element) {
            // Nếu truyền vào element, di chuyển đến element đó
            await page.waitForSelector(element, { timeout });
            const elem = await page.$(element);
            const box = await elem.boundingBox();
            await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        } else if (x !== null && y !== null) {
            // Nếu truyền tọa độ (x, y)
            await page.mouse.move(x, y);
        } else {
            throw new Error("Cần truyền tọa độ hoặc element");
        }
        console.log('Mouse moved successfully');
        return "success";
    } catch (error) {
        console.error('Error in mouseMove:', error);
        return `Error: ${error.message}`;
    }
}

async function mouseClick(page, x = null, y = null, element = null, timeout = 5000) {
    try {
        if (element) {
            // Nếu truyền vào element, click vào element đó
            await page.waitForSelector(element, { timeout });
            const elem = await page.$(element);
            const box = await elem.boundingBox();
            await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        } else if (x !== null && y !== null) {
            // Nếu truyền tọa độ (x, y)
            await page.mouse.click(x, y);
        } else {
            throw new Error("Cần truyền tọa độ hoặc element");
        }
        console.log('Mouse clicked successfully');
        return "success";
    } catch (error) {
        console.error('Error in mouseClick:', error);
        return `Error: ${error.message}`;
    }
}


module.exports = { pressKey, forms, mouseMove, mouseClick };
