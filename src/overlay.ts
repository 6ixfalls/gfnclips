window.addEventListener('mousemove', event => {
    if (event.target === document.documentElement) // <html>-element
        window.setIgnoreMouseEvents(true, { forward: true })   // {forward: true} keeps generating MouseEvents
    else
        window.setIgnoreMouseEvents(false)
})