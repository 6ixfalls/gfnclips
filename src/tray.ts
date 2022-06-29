// eslint-disable-next-line @typescript-eslint/no-explicit-any

document.querySelector('#minimize').addEventListener('click', () => {
    console.log("a");
    window.api.send('minimize-window', true);
});

document.querySelector('#close').addEventListener('click', () => {
    console.log("b");
    window.api.send('close-window', true);
});

document.querySelector('#overlay').addEventListener('click', () => {
    console.log("b");
    window.api.send('show-window', true);
});