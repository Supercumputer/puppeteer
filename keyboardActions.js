async function xpathCoordinates(page, path) {
    const resultsHandle = await page.evaluateHandle(path => {
        let results = [];
        let query = document.evaluate(path, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        for (let i = 0, length = query.snapshotLength; i < length; ++i) {
            results.push(query.snapshotItem(i));
        }
        return results;
    }, path);

    const properties = await resultsHandle.getProperties();
    const result = [];
    const releasePromises = [];

    for (const property of properties.values()) {
        const element = property.asElement();
        if (element) {
            const box = await element.boundingBox(); // Lấy tọa độ x, y và kích thước
            if (box) {
                result.push({
                    x: box.x,
                    y: box.y
                });
            }
        } else {
            releasePromises.push(property.dispose());
        }
    }

    await Promise.all(releasePromises);
    return result; // Trả về danh sách tọa độ của các phần tử
}

async function pressKey(page, selector, action, key, pressTime = 0) {
    try {
        // Đợi cho đến khi phần tử xuất hiện trên trang
        await page.waitForSelector(selector);

        const element = await page.$(selector);

        if (!element) {
            throw new Error(`No element found for selector: ${selector}`);
        }

        // Lấy tọa độ của phần tử
        const box = await element.boundingBox();
        const x = box.x + box.width / 2;
        const y = box.y + box.height / 2;

        // Di chuyển chuột đến vị trí của phần tử
        await page.mouse.move(x, y, { steps: 10 });

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
                await page.waitForFunction(
                    (xpath) => document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue !== null,
                    { timeout: selectorTimeout },
                    selector
                );
            }

            elements = [await page.evaluateHandle((xpath) => {
                return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            }, selector)];
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

async function mouseMove(page, x = null, y = null, selectorType = null, selectorValue = null, timeout = 5000) {
    try {
        let elem;

        if (selectorValue) {
            if (selectorType === 'xpath') {

                // Xử lý phần tử bằng XPath
                await page.waitForFunction(
                    (xpath) => {
                        const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                        return result !== null;
                    },
                    { timeout },
                    selectorValue
                );

                elem = await page.evaluateHandle((xpath) => {
                    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                    return result;
                }, selectorValue);

                const box = await elem.boundingBox();
                await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
            } else if (selectorType === 'css') {
                // Xử lý phần tử bằng CSS selector
                await page.waitForSelector(selectorValue, { timeout });
                elem = await page.$(selectorValue);
                const box = await elem.boundingBox();
                await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
            } else {
                throw new Error(`Invalid selector type: ${selectorType}`);
            }
        } else if (x !== null && y !== null) {
            // Nếu truyền tọa độ (x, y)
            await page.mouse.move(x, y, { steps: 10 });
        } else {
            throw new Error("Cần truyền tọa độ hoặc selectorValue");
        }

        console.log('Mouse moved successfully');
        return "success";
    } catch (error) {
        if (error.name === 'TimeoutError') {
            console.error('Element not found:', selectorValue);
            return `Element not found: ${selectorValue}`;
        } else {
            console.error('Error in mouseMove:', error);
            return `Error: ${error.message}`;
        }
    }
}

async function mouseClick(page, x = null, y = null, selectorType = null, selectorValue = null, timeout = 5000) {
    try {
        let elem;

        if (selectorValue) {
            if (selectorType === 'xpath') {
                // Xử lý phần tử bằng XPath
                await page.waitForFunction(
                    (xpath) => {
                        const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                        return result !== null;
                    },
                    { timeout },
                    selectorValue
                );

                elem = await page.evaluateHandle((xpath) => {
                    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                    return result;
                }, selectorValue);

                const box = await elem.boundingBox();

                // Di chuyển chuột đến giữa phần tử trước khi click
                await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
                await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
            } else if (selectorType === 'css') {
                // Xử lý phần tử bằng CSS selector
                await page.waitForSelector(selectorValue, { timeout });
                elem = await page.$(selectorValue);
                const box = await elem.boundingBox();

                // Di chuyển chuột đến giữa phần tử trước khi click
                await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
                await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
            } else {
                throw new Error(`Invalid selector type: ${selectorType}`);
            }
        } else if (x !== null && y !== null) {
            // Nếu truyền tọa độ (x, y)

            // Di chuyển chuột đến vị trí (x, y) trước khi click
            await page.mouse.move(x, y);
            await page.mouse.click(x, y);
        } else {
            throw new Error("Cần truyền tọa độ hoặc selectorValue");
        }

        console.log('Mouse moved and clicked successfully');
        return "success";
    } catch (error) {
        if (error.name === 'TimeoutError') {
            console.error('Element not found:', selectorValue);
            return `Element not found: ${selectorValue}`;
        } else {
            console.error('Error in mouseClick:', error);
            return `Error: ${error.message}`;
        }
    }
}

async function hoverElement(page, selectorType, selectorValue, options = {}) {
    const {
        markElement = false,
        waitForSelector = false,
        selectorTimeout = 20000, // Default timeout 20s
        multiple = false // Default is false, meaning single element
    } = options;

    let elements;

    // Chờ phần tử nếu cần
    if (waitForSelector) {
        try {
            if (selectorType === 'css') {
                await page.waitForSelector(selectorValue, { timeout: selectorTimeout });
            } else if (selectorType === 'xpath') {
                await page.waitForFunction(
                    (xpath) => document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue !== null,
                    { timeout: selectorTimeout },
                    selectorValue
                );
            }
        } catch (error) {
            console.error('Element not found:', error.message);
            return 'element not found';
        }
    }

    // Tìm phần tử dựa trên selector type
    if (selectorType === 'css') {
        if (multiple) {
            elements = await page.$$(selectorValue); // Sử dụng $$ để tìm nhiều phần tử
        } else {
            elements = [await page.$(selectorValue)]; // Đặt phần tử vào mảng để xử lý đồng nhất
        }
    } else if (selectorType === 'xpath') {
        if (multiple) {
            elements = await page.evaluateHandle((xpath) => {
                const nodes = [];
                const iterator = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
                let node = iterator.iterateNext();
                while (node) {
                    nodes.push(node);
                    node = iterator.iterateNext();
                }
                return nodes;
            }, selectorValue);
        } else {
            elements = [await page.evaluateHandle((xpath) => {
                return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            }, selectorValue)];
        }
    }

    if (!elements || elements.length === 0) {
        console.error('Element not found');
        return 'element not found';
    }

    // Đánh dấu phần tử nếu tùy chọn bật
    if (markElement) {
        for (const element of elements) {
            await page.evaluate(el => {
                if (el) el.style.border = '2px solid red'; // Đánh dấu bằng đường viền đỏ
            }, element);
        }
    }

    // Di chuyển chuột và kích hoạt sự kiện "mouseover" cho tất cả các phần tử
    for (const element of elements) {
        const box = await element.boundingBox();
        if (box) {
            // Di chuyển chuột đến giữa phần tử
            await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });

            // Kích hoạt sự kiện "mouseover"
            await page.evaluate(el => {
                if (el) el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
            }, element);
        } else {
            console.error('Could not get bounding box');
            return 'bounding box not found';
        }
    }

    return 'success';
}

async function ScrollElement(page, findBy, selector, options = {}) {
    const {
        multiple = false,
        markElement = false,
        waitForSelector = false,
        selectorTimeout = 3000,
        scrollHorizontal = 0,
        scrollVertical = 0,
        scrollIntoView = false,
        smoothScroll = false,
        incrementHorizontal = false,
        incrementVertical = false,
    } = options;

    let elements;

    try {

        // Chờ phần tử nếu cần
        if (waitForSelector) {
            try {
                if (findBy === 'css') {
                    await page.waitForSelector(selector, { timeout: selectorTimeout });
                } else if (findBy === 'xpath') {
                    await page.waitForFunction(
                        (xpath) => document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue !== null,
                        { timeout: selectorTimeout },
                        selector
                    );
                }
            } catch (error) {
                console.error('Element not found:', error.message);
                return 'element not found';
            }
        }

        // Tìm phần tử dựa trên css hoặc xpath
        if (findBy === 'css') {
            if (multiple) {
                elements = await page.$$(selector); // Sử dụng $$ để tìm nhiều phần tử
            } else {
                elements = [await page.$(selector)]; // Đặt phần tử vào mảng để xử lý đồng nhất
            }
        } else if (findBy === 'xpath') {
            if (multiple) {
                elements = await page.evaluateHandle((xpath) => {
                    const nodes = [];
                    const iterator = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
                    let node = iterator.iterateNext();
                    while (node) {
                        nodes.push(node);
                        node = iterator.iterateNext();
                    }
                    return nodes;
                }, selector);
            } else {
                elements = [await page.evaluateHandle((xpath) => {
                    return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                }, selector)];
            }
        }

        if (elements.length === 0 || !elements[0]) {
            return 'Element not found';
        }

        for (let element of elements) {
            // Di chuyển chuột đến phần tử
            const box = await element.boundingBox();
            if (box) {
                await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
            } else {
                console.error('Could not get bounding box');
                return 'bounding box not found';
            }

            // Đánh dấu phần tử nếu được yêu cầu
            if (markElement) {
                if (element) {
                    await page.evaluate(el => {
                        if (el) el.style.border = '2px solid red';
                    }, element);
                }
            }

            // Cuộn phần tử vào tầm nhìn nếu tùy chọn được kích hoạt
            if (scrollIntoView) {
                await page.evaluate((el, smooth) => {
                    if (el) el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'center', inline: 'center' });
                }, element, smoothScroll);
            } else {
                if (incrementHorizontal || incrementVertical) {
                    const horizontalStep = incrementHorizontal ? scrollHorizontal : 0;
                    const verticalStep = incrementVertical ? scrollVertical : 0;

                    await page.evaluate((el, horizontalStep, verticalStep, smooth) => {
                        if (el) {
                            el.scroll({ left: horizontalStep, top: verticalStep, behavior: smooth ? 'smooth' : 'auto' });
                        }
                    }, element, horizontalStep, verticalStep, smoothScroll);
                } else {
                    await page.evaluate((el, scrollHorizontal, scrollVertical, smooth) => {
                        if (el) {
                            el.scroll({ left: scrollHorizontal, top: scrollVertical, behavior: smooth ? 'smooth' : 'auto' });
                        }
                    }, element, scrollHorizontal, scrollVertical, smoothScroll);
                }
            }
        }

        return 'Success';
    } catch (error) {
        // Bắt lỗi TimeoutError
        if (error.name === 'TimeoutError') {
            return 'Element not found';
        } else {
            throw error; // Ném lỗi khác nếu không phải TimeoutError
        }
    }
}

module.exports = { pressKey, forms, mouseMove, mouseClick, hoverElement, ScrollElement, xpathCoordinates };
