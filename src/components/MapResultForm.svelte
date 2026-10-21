<script lang="ts">
	import { onMount } from 'svelte';
	import { firebaseConfigured, firebasePlaces, firebaseSignedIn, savePlace, signIn, signOut, watchPlaces } from '../lib/firebase.js';
	let open = $state(false);
	let records = $state<any[]>([]);
	let recordId = $state('');
	let name = $state('');
	let type = $state('');
	let status = $state('Present');
	let address = $state('');
	let description = $state('');
	let latitude = $state('44.948');
	let longitude = $state('-93.25');
	let message = $state('');
	let saving = $state(false);
	let email = $state('');
	let password = $state('');
	let signedIn = $state(false);
	onMount(() => {
		const unsubscribe = watchPlaces((error) => { message = error.message; });
		const storeUnsubscribe = firebasePlaces.subscribe((items) => records = items as any[]);
		const authUnsubscribe = firebaseSignedIn.subscribe((value) => signedIn = value);
		return () => { unsubscribe(); storeUnsubscribe(); authUnsubscribe(); };
	});
	async function login(event: SubmitEvent) {
		event.preventDefault(); message = '';
		try { await signIn(email, password); message = 'Signed in.'; }
		catch (error) { message = error instanceof Error ? error.message : 'Unable to sign in.'; }
	}
	function loadRecord() {
		const record = records.find((item) => item.id === recordId);
		if (!record) return;
		name = record.Name ?? ''; type = record.Type ?? ''; status = record.Still_there_ ?? 'Present';
		address = record.Address ?? ''; description = record.description ?? '';
		longitude = String(record.coordinates?.[0] ?? -93.25); latitude = String(record.coordinates?.[1] ?? 44.948);
	}
	async function submit(event: SubmitEvent) {
		event.preventDefault(); saving = true; message = '';
		try {
			await savePlace({ Name: name, Type: type, Still_there_: status, Address: address, description, coordinates: [Number(longitude), Number(latitude)] }, recordId);
			message = recordId ? 'Map result updated.' : 'Map result added.';
			if (!recordId) { name = ''; type = ''; address = ''; description = ''; }
		} catch (error) { message = error instanceof Error ? error.message : 'Unable to save map result.'; }
		finally { saving = false; }
	}
</script>

<section class="editor">
	<button class="toggle" type="button" onclick={() => open = !open}>Manage map results</button>
	{#if open}
		<div class="panel">
			<h2>Map result editor</h2>
			{#if !firebaseConfigured}<p>Firebase is not configured. Add the Firebase values to your environment file.</p>{:else if !signedIn}
			<form onsubmit={login}><label>Email<input type="email" required bind:value={email} /></label><label>Password<input type="password" required bind:value={password} /></label><button type="submit">Sign in to manage results</button></form>
			{:else}
			<button class="signout" type="button" onclick={signOut}>Sign out</button>
			<form onsubmit={submit}>
				<label>Update existing result<select bind:value={recordId} onchange={loadRecord}><option value="">Add a new result</option>{#each records as record}<option value={record.id}>{record.Name}</option>{/each}</select></label>
				<label>Name<input required bind:value={name} /></label>
				<label>Type<input required bind:value={type} /></label>
				<label>Status<select bind:value={status}><option>Present</option><option>Future</option><option>Gone</option><option>Past</option></select></label>
				<label>Address<input required bind:value={address} /></label>
				<label>Description<textarea bind:value={description} rows="3"></textarea></label>
				<div class="coordinates"><label>Latitude<input type="number" step="any" required bind:value={latitude} /></label><label>Longitude<input type="number" step="any" required bind:value={longitude} /></label></div>
				<button type="submit" disabled={saving}>{saving ? 'Saving…' : recordId ? 'Update result' : 'Add result'}</button>
			</form>{/if}
			{#if message}<p role="status">{message}</p>{/if}
		</div>
	{/if}
</section>

<style>
	.editor{padding:24px 28px;border-top:1px solid #d4ccbd}.toggle,form button{border:0;background:#7450b8;color:white;padding:11px 15px;font:inherit;cursor:pointer}.panel{max-width:560px;padding:20px 0}.panel h2{font:24px Georgia,serif}.panel form{display:grid;gap:12px}.panel label{display:grid;gap:5px;font-size:12px}.panel input,.panel select,.panel textarea{width:100%;padding:9px;border:1px solid #c7c0b3;background:#fffdf8;font:inherit}.coordinates{display:grid;grid-template-columns:1fr 1fr;gap:12px}.panel p{font-size:13px;color:#615f54}
</style>
