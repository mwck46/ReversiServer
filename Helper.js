// Perform Fisher Yates shuffle in-place on array
export function shuffle(arr){
	for(let i=arr.length-1; i>=0; --i){
		const temp = arr[i];

    const idx = Math.floor(Math.random() * i);
    arr[i] = arr[idx];
    arr[idx] = temp;
	}

  //console.log(arr);
  return arr;
}