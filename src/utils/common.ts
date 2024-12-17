

export const objUnion = (a: any, b: any) => {
	let equal = true
	Object.keys(a).forEach(key => {
		if(b[key]) {
			equal = equal && deepEqual(a[key], b[key])
		}
	})
	return equal
}

export const deepEqual = (a: any, b: any) => {
	if(typeof a !== typeof b) return false
	if(typeof a !== 'object') return a === b
	let equal = true
	Object.keys(a).forEach(key => {
		if(!b[key]) return false
		if(typeof a[key] === 'object') {
			equal = equal && deepEqual(a[key], b[key])
		} else {
			equal = equal && (a[key] === b[key])
		}
	})
	return equal
}
