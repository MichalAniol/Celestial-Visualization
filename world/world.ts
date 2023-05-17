(function () {
    const IMG_WIDTH = 1000
    const IMG_HEIGHT = 507

    const canvas = <HTMLCanvasElement>document.getElementById("canvas")
    canvas.addEventListener('error', () => { })
    canvas.width = IMG_WIDTH
    canvas.height = IMG_HEIGHT

    const ctx: CanvasRenderingContext2D = canvas.getContext("2d")

    const img = new Image
    // @ts-expect-error
    img.src = imgSrc
    ctx.drawImage(img, 0, 0)

    // const pixel = ctx.getImageData(300, 300, 2, 2).data
    // console.log('%c pixel:', 'background: #ffcc00; color: #003300', pixel)

    const imgDataElem = document.getElementById('imgData')
    const imgRowLengthElem = document.getElementById('imgRowLength')
    const imgRowStartElem = document.getElementById('imgRowStart')

    imgDataElem.innerHTML = 'const imgData = ['
    imgRowLengthElem.innerHTML = 'const imgRowLength = ['
    imgRowStartElem.innerHTML = 'const imgRowStart = ['

    const TAB_X = IMG_WIDTH
    const TAB_Y = IMG_HEIGHT
    const SCALE = 1

    setTimeout(() => {

        for (let y = 0; y < TAB_Y; y += SCALE) {
            let rowLength = 0
            let imgInner = ''
            let imgRowStart = 0
            let rowStarted = false

            for (let x = 0; x < TAB_X; x += SCALE) {
                let r = 0
                let g = 0
                let b = 0
                let a = 0
                const pixel = ctx.getImageData(x, y, SCALE, SCALE).data
                for (let yy = 0; yy < SCALE; ++yy) {
                    for (let xx = 0; xx < SCALE; ++xx) {
                        const pos = ((yy * SCALE) + xx) * 4
                        r += pixel[pos]
                        g += pixel[pos + 1]
                        b += pixel[pos + 2]
                        a += pixel[pos + 3]
                    }
                }

                if (a < 128) {
                    if (!rowStarted) ++imgRowStart
                    continue
                }
                if ((r + b + g) / 3 > 128 * SCALE * SCALE) {
                    imgInner += ',0'
                    rowLength++
                    rowStarted = true
                    continue
                }
                imgInner += ',1'
                rowLength++
                rowStarted = true
            }

            imgDataElem.innerHTML += `[${imgInner}]${y < TAB_Y - SCALE + 1 ? ',<br>' : ']'}`
            imgRowLengthElem.innerHTML += `${rowLength}${y < TAB_Y - SCALE ? ',' : ']'}`
            imgRowStartElem.innerHTML += `${imgRowStart}${y < TAB_Y - SCALE ? ',' : ']'}`
            console.log('%c rowLength:', 'background: #ffcc00; color: #003300', rowLength)
        }
    }, 1500);
}())