export function $(id){
    return document.getElementById(id);
}

// just protects from messy user input
export function cleanName(str) {
    return (str || "").trim().replace(/\s+/g, " ");
}