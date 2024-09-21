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

// async function xpathCoordinates(page, path) {
//     // Sử dụng page.evaluateHandle để lấy danh sách các phần tử bằng XPath
//     const resultsHandle = await page.evaluateHandle((path) => {
//         let results = [];
//         let query = document.evaluate(path, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
//         for (let i = 0, length = query.snapshotLength; i < length; ++i) {
//             results.push(query.snapshotItem(i)); // Thêm tất cả phần tử vào mảng
//         }
//         return results; // Trả về mảng các phần tử DOM
//     }, path);

//     const properties = await resultsHandle.getProperties();
//     const elements = [];

//     // Chuyển đổi mỗi phần tử DOM thành ElementHandle
//     for (const property of properties.values()) {
//         const element = property.asElement(); // Chuyển thành ElementHandle
//         if (element) {
//             elements.push(element); // Thêm ElementHandle vào mảng
//         } else {
//             property.dispose(); // Giải phóng các property không phải là element
//         }
//     }

//     return elements; // Trả về mảng các ElementHandle
// }

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

        if (error.name === 'TimeoutError') {
            console.error('Element not found:', selector);
            return `Element not found: ${selector}`;
        } else {
            console.error('Error pressing keys:', error);
            return `Error: ${error.message}`;
        }
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

// async function mouseMove(page, x = null, y = null, selectorType = null, selectorValue = null, timeout = 5000) {
//     try {
//         let elem;

//         if (selectorValue) {
//             if (selectorType === 'xpath') {

//                 // Xử lý phần tử bằng XPath
//                 await page.waitForFunction(
//                     (xpath) => {
//                         const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
//                         return result !== null;
//                     },
//                     { timeout },
//                     selectorValue
//                 );

//                 elem = await page.evaluateHandle((xpath) => {
//                     const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
//                     return result;
//                 }, selectorValue);

//                 const box = await elem.boundingBox();
//                 await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
//             } else if (selectorType === 'css') {
//                 // Xử lý phần tử bằng CSS selector
//                 await page.waitForSelector(selectorValue, { timeout });
//                 elem = await page.$(selectorValue);
//                 const box = await elem.boundingBox();
//                 await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
//             } else {
//                 throw new Error(`Invalid selector type: ${selectorType}`);
//             }
//         } else if (x !== null && y !== null) {
//             // Nếu truyền tọa độ (x, y)
//             await page.mouse.move(x, y, { steps: 10 });
//         } else {
//             throw new Error("Cần truyền tọa độ hoặc selectorValue");
//         }

//         console.log('Mouse moved successfully');
//         return "success";
//     } catch (error) {
//         if (error.name === 'TimeoutError') {
//             console.error('Element not found:', selectorValue);
//             return `Element not found: ${selectorValue}`;
//         } else {
//             console.error('Error in mouseMove:', error);
//             return `Error: ${error.message}`;
//         }
//     }
// }

async function mouseMove(page, selectorType, options = {}, timeout = 5000, markElement = false, multiple = false) {
    try {
        let elements = [];
        let { x = null, y = null, selectorValue = null } = options;

        if (selectorType === 'coordinates') {
            // Trường hợp tọa độ x, y
            if (x !== null && y !== null) {
                await page.mouse.move(x, y, { steps: 10 });
                if (markElement) {
                    await page.evaluate((x, y) => {
                        const marker = document.createElement('div');
                        marker.style.position = 'absolute';
                        marker.style.top = `${y}px`;
                        marker.style.left = `${x}px`;
                        marker.style.width = '10px';
                        marker.style.height = '10px';
                        marker.style.backgroundColor = 'red';
                        marker.style.borderRadius = '50%';
                        document.body.appendChild(marker);
                    }, x, y);
                }
            } else {
                throw new Error("Cần truyền tọa độ (x, y) cho selectorType 'coordinates'.");
            }
        } else if (selectorType === 'css' || selectorType === 'xpath') {
            if (!selectorValue) {
                throw new Error(`Cần truyền selectorValue cho selectorType '${selectorType}'.`);
            }

            if (selectorType === 'xpath') {

                // Đầu tiên, kiểm tra xem XPath có trả về nhiều phần tử hay không
                const elementCount = await page.evaluate((xpath) => {
                    const iterator = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
                    let count = 0;
                    let node = iterator.iterateNext();
                    while (node) {
                        count++;
                        node = iterator.iterateNext();
                    }
                    return count;
                }, selectorValue);

                // Nếu có nhiều hơn 1 phần tử và multiple là true
                if (elementCount > 1 && multiple) {
                    const elementsArray = await page.evaluate((xpath) => {
                        const iterator = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
                        let node = iterator.iterateNext();
                        const nodes = [];
                        while (node) {
                            nodes.push(node); // Đẩy từng phần tử DOM vào mảng nodes
                            node = iterator.iterateNext();
                        }
                        return nodes;
                    }, selectorValue);

                    // Chuyển đổi mỗi phần tử DOM thành ElementHandle trong Puppeteer
                    elements = await Promise.all(elementsArray.map(async (element) => {
                        return await page.evaluateHandle((el) => el, element);
                    }));

                } else {
                    const element = await page.evaluateHandle((xpath) => {
                        return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                    }, selectorValue);

                    elements.push(element);
                }
            } else if (selectorType === 'css') {
                // Xử lý phần tử bằng CSS selector
                await page.waitForSelector(selectorValue, { timeout });
                if (multiple) {
                    elements = await page.$$(selectorValue);
                } else {
                    const element = await page.$(selectorValue);
                    elements.push(element);
                }
            }

            for (let elem of elements) {

                const box = await elem.boundingBox();
                await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });

                if (markElement) {
                    await page.evaluate((elem) => {
                        elem.style.border = '2px solid red';
                    }, elem);
                }
            }
        } else {
            throw new Error(`Invalid selector type: ${selectorType}`);
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

// async function mouseClick(page, x = null, y = null, selectorType = null, selectorValue = null, timeout = 5000) {
//     try {
//         let elem;

//         if (selectorValue) {
//             if (selectorType === 'xpath') {
//                 // Xử lý phần tử bằng XPath
//                 await page.waitForFunction(
//                     (xpath) => {
//                         const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
//                         return result !== null;
//                     },
//                     { timeout },
//                     selectorValue
//                 );

//                 elem = await page.evaluateHandle((xpath) => {
//                     const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
//                     return result;
//                 }, selectorValue);

//                 const box = await elem.boundingBox();

//                 // Di chuyển chuột đến giữa phần tử trước khi click
//                 await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
//                 await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
//             } else if (selectorType === 'css') {
//                 // Xử lý phần tử bằng CSS selector
//                 await page.waitForSelector(selectorValue, { timeout });
//                 elem = await page.$(selectorValue);
//                 const box = await elem.boundingBox();

//                 // Di chuyển chuột đến giữa phần tử trước khi click
//                 await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
//                 await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
//             } else {
//                 throw new Error(`Invalid selector type: ${selectorType}`);
//             }
//         } else if (x !== null && y !== null) {
//             // Nếu truyền tọa độ (x, y)

//             // Di chuyển chuột đến vị trí (x, y) trước khi click
//             await page.mouse.move(x, y);
//             await page.mouse.click(x, y);
//         } else {
//             throw new Error("Cần truyền tọa độ hoặc selectorValue");
//         }

//         console.log('Mouse moved and clicked successfully');
//         return "success";
//     } catch (error) {
//         if (error.name === 'TimeoutError') {
//             console.error('Element not found:', selectorValue);
//             return `Element not found: ${selectorValue}`;
//         } else {
//             console.error('Error in mouseClick:', error);
//             return `Error: ${error.message}`;
//         }
//     }
// }

async function mouseClick(page, selectorType, options = {}, timeout = 5000, markElement = false, multiple = false) {
    try {
        let elements = [];
        let { x = null, y = null, selectorValue = null } = options;

        if (selectorType === 'coordinates') {
            // Trường hợp tọa độ x, y
            if (x !== null && y !== null) {
                // Di chuyển và click vào tọa độ (x, y)
                await page.mouse.move(x, y);
                await page.mouse.click(x, y);
                if (markElement) {
                    await page.evaluate((x, y) => {
                        const marker = document.createElement('div');
                        marker.style.position = 'absolute';
                        marker.style.top = `${y}px`;
                        marker.style.left = `${x}px`;
                        marker.style.width = '10px';
                        marker.style.height = '10px';
                        marker.style.backgroundColor = 'red';
                        marker.style.borderRadius = '50%';
                        document.body.appendChild(marker);
                    }, x, y);
                }
            } else {
                throw new Error("Cần truyền tọa độ (x, y) cho selectorType 'coordinates'.");
            }
        } else if (selectorType === 'css' || selectorType === 'xpath') {
            if (!selectorValue) {
                throw new Error(`Cần truyền selectorValue cho selectorType '${selectorType}'.`);
            }

            if (selectorType === 'xpath') {
                // Đầu tiên, kiểm tra xem XPath có trả về nhiều phần tử hay không
                const elementCount = await page.evaluate((xpath) => {
                    const iterator = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
                    let count = 0;
                    let node = iterator.iterateNext();
                    while (node) {
                        count++;
                        node = iterator.iterateNext();
                    }
                    return count;
                }, selectorValue);

                // Nếu có nhiều hơn 1 phần tử và multiple là true
                if (elementCount > 1 && multiple) {
                    const elementsArray = await page.evaluate((xpath) => {
                        const iterator = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
                        let node = iterator.iterateNext();
                        const nodes = [];
                        while (node) {
                            nodes.push(node); // Đẩy từng phần tử DOM vào mảng nodes
                            node = iterator.iterateNext();
                        }
                        return nodes;
                    }, selectorValue);

                    // Chuyển đổi mỗi phần tử DOM thành ElementHandle trong Puppeteer
                    elements = await Promise.all(elementsArray.map(async (element) => {
                        return await page.evaluateHandle((el) => el, element);
                    }));

                } else {
                    const element = await page.evaluateHandle((xpath) => {
                        return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                    }, selectorValue);
                    elements.push(element);
                }
            } else if (selectorType === 'css') {
                // Xử lý phần tử bằng CSS selector
                await page.waitForSelector(selectorValue, { timeout });
                if (multiple) {
                    elements = await page.$$(selectorValue);
                } else {
                    const element = await page.$(selectorValue);
                    elements.push(element);
                }
            }

            for (let elem of elements) {
                const box = await elem.boundingBox();
                await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
                await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

                if (markElement) {
                    await page.evaluate((elem) => {
                        elem.style.border = '2px solid red';
                    }, elem);
                }
            }
        } else {
            throw new Error(`Invalid selector type: ${selectorType}`);
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

    let elements = [];

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
        // Đầu tiên, kiểm tra xem XPath có trả về nhiều phần tử hay không
        const elementCount = await page.evaluate((xpath) => {
            const iterator = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
            let count = 0;
            let node = iterator.iterateNext();
            while (node) {
                count++;
                node = iterator.iterateNext();
            }
            return count;
        }, selectorValue);

        // Nếu có nhiều hơn 1 phần tử và multiple là true
        if (elementCount > 1 && multiple) {
            const elementsArray = await page.evaluate((xpath) => {
                const iterator = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
                let node = iterator.iterateNext();
                const nodes = [];
                while (node) {
                    nodes.push(node); // Đẩy từng phần tử DOM vào mảng nodes
                    node = iterator.iterateNext();
                }
                return nodes;
            }, selectorValue);

            // Chuyển đổi mỗi phần tử DOM thành ElementHandle trong Puppeteer
            elements = await Promise.all(elementsArray.map(async (element) => {
                return await page.evaluateHandle((el) => el, element);
            }));

        } else {
            const element = await page.evaluateHandle((xpath) => {
                return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            }, selectorValue);
            elements.push(element);
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

    let elements = [];

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
            // Đầu tiên, kiểm tra xem XPath có trả về nhiều phần tử hay không
            const elementCount = await page.evaluate((xpath) => {
                const iterator = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
                let count = 0;
                let node = iterator.iterateNext();
                while (node) {
                    count++;
                    node = iterator.iterateNext();
                }
                return count;
            }, selectorValue);

            // Nếu có nhiều hơn 1 phần tử và multiple là true
            if (elementCount > 1 && multiple) {
                const elementsArray = await page.evaluate((xpath) => {
                    const iterator = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
                    let node = iterator.iterateNext();
                    const nodes = [];
                    while (node) {
                        nodes.push(node); // Đẩy từng phần tử DOM vào mảng nodes
                        node = iterator.iterateNext();
                    }
                    return nodes;
                }, selectorValue);

                // Chuyển đổi mỗi phần tử DOM thành ElementHandle trong Puppeteer
                elements = await Promise.all(elementsArray.map(async (element) => {
                    return await page.evaluateHandle((el) => el, element);
                }));

            } else {
                const element = await page.evaluateHandle((xpath) => {
                    return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                }, selectorValue);
                elements.push(element);
            }
        }

        if (elements.length === 0 || !elements[0]) {
            console.error('No elements found for selector:', selector);
            return 'Element not found';
        }

        for (let element of elements) {

            // Kiểm tra xem element có phải là một phần tử hợp lệ không
            if (element && typeof element.boundingBox === 'function') {
                const box = await element.boundingBox();

                if (box) {
                    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
                } else {
                    console.error('Could not get bounding box');
                    return 'bounding box not found';
                }
            } else {
                console.error('Element is not valid or boundingBox is not a function');
                return 'Invalid element';
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

                    await page.evaluate((horizontalStep, verticalStep, smooth) => {

                        window.scrollBy({
                            left: horizontalStep,
                            top: verticalStep,
                            behavior: smooth ? 'smooth' : 'auto'
                        });

                    }, horizontalStep, verticalStep, smoothScroll);
                } else {
                    // Cuộn trang đến vị trí cụ thể nếu không phải cuộn theo phần tử
                    await page.evaluate((scrollHorizontal, scrollVertical, smooth) => {
                        window.scrollBy({
                            left: scrollHorizontal,
                            top: scrollVertical,
                            behavior: smooth ? 'smooth' : 'auto'
                        });
                    }, scrollHorizontal, scrollVertical, smoothScroll);
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

async function switchFrame(page, windowType, findBy, selectorValue) {
    try {
        if (windowType === 'main-window') {
            await page.mainFrame();
            console.log('Switched to main window');
            return 'success';
        } else if (windowType === 'iframe') {

            if (!findBy || !selectorValue) {
                throw new Error('Must provide both findBy and selectorValue when switching to an iframe');
            }

            let frameElement;

            // Find iframe based on `findBy` type
            if (findBy === 'css') {
                await page.waitForSelector(selectorValue, { visible: true, timeout: 20000 }); // Wait for iframe to appear
                frameElement = await page.$(selectorValue);
            } else if (findBy === 'xpath') {
                frameElement = await page.evaluateHandle((xpath) => {
                    return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                }, selectorValue);
            }

            if (!frameElement) {
                throw new Error('Unable to find the iframe with the provided selector');
            }

            const frame = await frameElement.contentFrame();

            if (frame) {
                await frame.waitForSelector('body', { timeout: 5000 }); // Wait for iframe content to load
                console.log('Switched to the iframe');
                return 'success'; // Return the iframe context to use in future actions
            } else {
                throw new Error('Failed to switch to the iframe');
            }
        }
    } catch (error) {
        if (error.name === 'TimeoutError') {
            return 'Element not found';
        } else {
            console.error('Error switching to iframe:', error);
            return error;
        }
    }

};

async function attributeValue(page, selectorType, selectorValue, options = {}) {
    const {
        markElement = false,
        waitForSelector = false,
        waitSelectorTimeout = 20000, // Thời gian chờ mặc định là 20 giây
        multiple = false,
        action = 'get', // 'get' hoặc 'set'
        attributeValue = '', // Giá trị để đặt nếu action là 'set'
        attributeName = '' // Tên thuộc tính cần lấy hoặc đặt
    } = options;

    let elements = [];

    // Chờ phần tử nếu cần
    if (waitForSelector) {
        try {
            if (selectorType === 'css') {
                await page.waitForSelector(selectorValue, { timeout: waitSelectorTimeout });
            } else if (selectorType === 'xpath') {
                await page.waitForFunction(
                    (xpath) => document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue !== null,
                    { timeout: waitSelectorTimeout },
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
        // Đầu tiên, kiểm tra xem XPath có trả về nhiều phần tử hay không
        const elementCount = await page.evaluate((xpath) => {
            const iterator = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
            let count = 0;
            let node = iterator.iterateNext();
            while (node) {
                count++;
                node = iterator.iterateNext();
            }
            return count;
        }, selectorValue);

        // Nếu có nhiều hơn 1 phần tử và multiple là true
        if (elementCount > 1 && multiple) {
            const elementsArray = await page.evaluate((xpath) => {
                const iterator = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
                let node = iterator.iterateNext();
                const nodes = [];
                while (node) {
                    nodes.push(node); // Đẩy từng phần tử DOM vào mảng nodes
                    node = iterator.iterateNext();
                }
                return nodes;
            }, selectorValue);

            // Chuyển đổi mỗi phần tử DOM thành ElementHandle trong Puppeteer
            elements = await Promise.all(elementsArray.map(async (element) => {
                return await page.evaluateHandle((el) => el, element);
            }));

        } else {
            const element = await page.evaluateHandle((xpath) => {
                return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            }, selectorValue);
            elements.push(element);
        }
    }

    if (!elements || elements.length === 0) {
        console.error('Element not found');
        return 'element not found';
    }

    let results = [];

    for (let element of elements) {
        if (markElement) {
            if (element) {
                await page.evaluate(el => {
                    if (el) el.style.border = '2px solid red';
                }, element);
            }
        }

        // Thực hiện hành động lấy hoặc đặt giá trị thuộc tính
        if (action === 'get') {
            const value = await page.evaluate((el, attrName) => {
                return el.getAttribute(attrName);
            }, element, attributeName);
            results.push(value);
        } else if (action === 'set') {
            await page.evaluate((el, attrName, attrValue) => {
                el.setAttribute(attrName, attrValue);
            }, element, attributeName, attributeValue);
            results.push('set completed');
        }
    }

    return results.length > 1 ? results : results[0]; // Trả về mảng nếu nhiều phần tử, ngược lại trả về giá trị đơn
}

module.exports = { pressKey, forms, mouseMove, mouseClick, hoverElement, ScrollElement, xpathCoordinates, switchFrame, attributeValue };
