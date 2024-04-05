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
							addBugToList(bugIndex, bug[1], bug[2], bug[3]);
						} else {
							console.log('The index is empty: ' + bugIndex);
						}
					} catch {
						console.log('Failed to get bug: ' + bugIndex);
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

function addBugToList(id, name, level, status) {
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
	// add text to the <li> element
	let bug = document.createTextNode(name);	

	// create a input element of type range to show levels of bug
	var range = document.createElement('INPUT');
	range.setAttribute('type', 'range');
	range.setAttribute('min', '0');
	range.setAttribute('max', '3');
	range.setAttribute('value', level + 1n);
	item.appendChild(range);

	
	// create a checkbox and set its id and status
	var checkbox = document.createElement('INPUT');
	checkbox.setAttribute('type', 'checkbox');
	checkbox.setAttribute('id', 'item-' + id + '-checkbox');
	checkbox.checked = status;
	// if status is true then add bug-done class to <li> element so that the text font has a line through
	if (status) {
		item.classList.add('bug-done');
	}
	list.appendChild(item);
	item.appendChild(bug);
	item.appendChild(checkbox);
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

// change critical level of bug stored on the blockchain
// async function changeBugLevel(id, bugIndex) {
// 	// get range element
// 	let range = document.getElementById(id);
// 	try {
// 		await contract.methods
// 			.updateBugLevel(bugIndex, range.value - 1n)
// 			.send({
// 				from: web3.eth.defaultAccount
// 			});
// 	} catch (error) {
// 		console.log('Failed to change level of bug. Index: ' + bugIndex);
// 	}
// }

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
				addBugToList(bugNum, name, false);
			},
			(err) => {
				console.log('Failed to retrieve the number of bugs from Ganache.');
			}
		);
	try {
		await contract.methods
			.addBug(name, false)
			.send({
				from: web3.eth.defaultAccount
			});
	} catch {
		console.log('Failed to save bug to blockchain.');
	}
}