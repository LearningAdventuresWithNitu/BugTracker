// jQuery is a JS library designed to simplify working with the DOM (Document Object Model) and event handling.
// This code runs the function createBugList() only after the DOM has completely loaded, ensuring safe DOM element interaction.
$(document).ready(createBugList());

//auto focus on input of add task modal
$('#add-bug-container').on('shown.bs.modal', function () {
	$('#new-bug').trigger('focus');
});

async function createBugList() {
	// Get first account provided by Ganache
	try {
		await getAccount();
		contract = new web3.eth.Contract(contractABI, contractAddress);

		try {
			bugNum = await contract.methods
				.getBugCount()
				.call({
					from: web3.eth.defaultAccount
				});

			console.log(bugNum);
			// If there is at least one bug present...
			if (bugNum != 0) {
				// fetch all of the bugs and create the list to display
				let bugIndex = 0;
				while (bugIndex < bugNum) {
					try {
						let bug = await contract.methods
							.getTask(bugIndex)
							.call({
								from: web3.eth.defaultAccount
							});
						if (bug[0] != '') {
							// addBugToList adds a bug as a child of the <ul> tag
							addBugToList(bugIndex, bug[0], bug[1], bug[2], bug[3]);
						} else {
							console.log('The index is empty: ' + bugIndex);
						}
					} catch (e) {
						console.log('Failed to get bug: ' + bugIndex + e);
					}
					bugIndex++;
				}
			}
		} catch (e) {
			console.log('Failed to retrieve bug count from blockchain.', e);
		}
	} catch {
		console.log('Failed to retrieve default account from blockchain.');
	}
}

function addBugToList(id, bugId, name, level, status) {
	// get the id of the <ul> then append children to it
	let list = document.getElementById('list');
	let item = document.createElement('li');
	item.classList.add(
		'list-group-item',
		'border-0',
		'd-flex',
		'justify-content-between',
		'align-items-center'
	);
	item.id = 'item-' + id;

	// create a text node to display the bug id
	let bugIdNode = document.createTextNode(bugId);
	let bugIdSpan = document.createElement('span');
    bugIdSpan.appendChild(bugIdNode);

	// add text to the <li> element
	let bug = document.createTextNode(name);

	// create a input element of type range to show levels of bug
	var range = document.createElement('INPUT');
	range.setAttribute('type', 'range');
	range.setAttribute('id', 'item-' + id + '-range');
	range.setAttribute('min', '0');
	range.setAttribute('max', '2');
	range.setAttribute('value', level);

	// change the background color of the bug depending on the level
	// 0: low, 1: medium, 2: high
	// green: low, yellow: medium, red: high
	if(level == 2){
		item.classList.add('bg-danger')
	} else if(level == 1){
		item.classList.add('bg-warning')
	}
	else{
		item.classList.add('bg-success')
	}
	
	// create a checkbox and set its id and status
	var checkbox = document.createElement('INPUT');
	checkbox.setAttribute('type', 'checkbox');
	checkbox.setAttribute('id', 'item-' + id + '-checkbox');
	checkbox.checked = status;
	// if status is true then add bug-done class to <li> element so that the text font has a line through
	if (status) {
		item.classList.add('bug-done');
	}

	let deleteButton = document.createElement('button');
	deleteButton.classList.add('btn', 'btn-dark');
	deleteButton.innerHTML = 'Delete';
	deleteButton.onclick = function () {
		deleteBugFromList(id);
	}

	let inputContainer = document.createElement('div');
    inputContainer.classList.add('input-container');
    inputContainer.appendChild(range);
    inputContainer.appendChild(checkbox);
	inputContainer.appendChild(deleteButton);

	item.appendChild(bugIdSpan);
	item.appendChild(bug);
	item.appendChild(inputContainer);

	list.appendChild(item);
	
	range.onchange = function () {
		changeBugLevel(range.id, id);
	};

	checkbox.onclick = function () {
		changeBugStatus(checkbox.id, id);
	};
}

// change the status of the bug stored on the blockchain
async function changeBugStatus(id, bugIndex) {
	// get checkbox element
	let checkbox = document.getElementById(id);
	// get the id of the <li> element
	let textId = id.replace('-checkbox', '');
	// get the <li> element
	let text = document.getElementById(textId);
	try {
		await contract.methods
			.updateBugStatus(bugIndex, checkbox.checked)
			.send({
				from: web3.eth.defaultAccount
			});
		if (checkbox.checked) {
			text.classList.add('bug-done');
		} else {
			text.classList.remove('bug-done');
		}
	} catch (error) {
		console.log('Failed to change status of bug. Index: ' + bugIndex);
	}
}

// change critical level of bug stored on the blockchain when the range input is changed
async function changeBugLevel(id, bugIndex, e) {
	// get range element
	let range = document.getElementById(id);
	let textId = id.replace('-range', '');
	// get the <li> element
	let text = document.getElementById(textId);
	try {
		await contract.methods
			.updateBugLevel(bugIndex, range.value)
			.send({
				from: web3.eth.defaultAccount
			});
		// change the background color of the bug depending on the level
		// 0: low, 1: medium, 2: high
		// green: low, yellow: medium, red: high
		if(range.value == 2){
			text.classList.remove('bg-success')
			text.classList.remove('bg-warning')
			text.classList.add('bg-danger')
		} else if(range.value == 1){
			text.classList.remove('bg-success')
			text.classList.add('bg-warning')
			text.classList.remove('bg-danger')
		}
		else{
			text.classList.add('bg-success')
			text.classList.remove('bg-warning')
			text.classList.remove('bg-danger')
		}
	} catch (error) {
		console.log('Failed to change level of bug. Index: ' + bugIndex);
	}
}

async function addBug(name) {
	let form = document.getElementById('add-bug-container');
	document.getElementById('new-bug').value = '';
	form.classList.remove('was-validated');
	contract.methods
		.getBugCount()
		.call({
			from: web3.eth.defaultAccount
		})
		.then(
			(bugNum) => {
				addBugToList(bugNum, "BUG-"+(bugNum+1n).toString(), name, 0, false);
			},
			(err) => {
				console.log('Failed to retrieve the number of bugs from Ganache.');
			}
		);
	try {
		await contract.methods
			.addBug(name)
			.send({
				from: web3.eth.defaultAccount,
				gas: 3000000
			});
	} catch (e) {
		console.log('Failed to save bug to blockchain.' + e);
	}
}

// delete bug from blockchain and remove from bug list as well
async function deleteBugFromList(bugIndex) {
	try {
		await deleteBug(bugIndex);
		document.getElementById('item-' + bugIndex).remove();
	} catch {
		console.log('Failed to delete bug from list.');
	}
}

async function deleteBug(bugIndex) {
	try {
		await contract.methods
			.deleteBug(bugIndex)
			.send({
				from: web3.eth.defaultAccount
			});
	} catch {
		console.log('Failed to delete bug from blockchain.');
	}
}