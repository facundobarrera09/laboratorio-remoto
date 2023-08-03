const identifier = localStorage.getItem('identifier')

const error = (error) => {
    console.log(error)
    document.querySelector('#title').innerHTML = 'Ocurrio un error inesperado'
    document.querySelector('.loading').setAttribute('hidden', '')
    document.querySelector('.cross').removeAttribute('hidden')
}

if (!identifier) {
    console.log('fetching id')
    $.ajax({
        url: 'http://127.0.0.1:3000/api/clients/identifier',
        headers: { 'Content-Type': 'application/json' },
        type: 'GET',
        success: (response) => {
            // save user data
            localStorage.setItem('identifier', response.identifier)
            console.log('new identifier:',response.identifier)

            // redirect user to new page
            window.location.replace('/main.html')
        },
        error
    })
}
else {
    console.log('checking if id valid')
    $.ajax({
        url: 'http://127.0.0.1:3000/api/clients/identifier',
        headers: { 'Content-Type': 'application/json' },
        type: 'POST',
        data: JSON.stringify({
            identifier
        }),
        success: (response) => {
            console.log('identifier is valid')

            if (response.valid)
                window.location.replace('/main.html')
            else {
                localStorage.removeItem('identifier')
                window.location.reload()
            }
        },
        error
    })
}