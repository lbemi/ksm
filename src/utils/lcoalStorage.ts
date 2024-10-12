

const set = (key:string ,value: any) => {
    localStorage.setItem(key, value)
}

const get = (key:string) => {
    return localStorage.getItem(key)
}
const remove = (key:string) => {
    localStorage.removeItem(key)
}

export {
    set,
    get,
    remove
}