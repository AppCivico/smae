<script setup>
	import { ref, onUpdated, onMounted } from 'vue'
	const props = defineProps(['controlador','grupo','label']);
	let control = ref(props.controlador)

	function start(){
		control.value = props.controlador;
	}
	start();
	onMounted(()=>{start()});
	onUpdated(()=>{start()});

	function removeParticipante(item,p) {
		item.participantes.splice(item.participantes.indexOf(p),1);
	}
	function busca(e,item,g,label) {
		e.preventDefault();
		e.stopPropagation();
		if (e.keyCode === 13) {
			var i = g.find(x=>!item.participantes.includes(x.id)&&x[label].toLowerCase().includes(item.busca.toLowerCase()));
			if(i) pushId(item.participantes,i.id);
			item.busca="";
		}
	}
	function pushId(e,id) {
		e.push(id);
		e = [...new Set(e)];
	}
</script>
<template>
	<template v-if="grupo?.length">
		<div class="suggestion search">
			<input type="text" 
					v-model="control.busca" 
					@keyup.enter.stop.prevent="busca($event,control,grupo,label)" 
					class="inputtext light mb05">
			<ul>
				<li v-for="r in grupo.filter(x=>!control.participantes.includes(x.id)&&x[label]?.toLowerCase().includes(control.busca.toLowerCase()))" 
					:key="r.id"
				><a @click="pushId(control.participantes,r.id)" tabindex="1">{{r[label]}}</a></li>
			</ul>
		</div>
		<span class="tagsmall" v-for="p in grupo.filter(x=>control.participantes.includes(x.id))" :key="p.id" @click="removeParticipante(control,p.id)">{{p[label]}}<svg width="12" height="12"><use xlink:href="#i_x"></use></svg></span>
	</template>
	<template v-else>
		<div class="search">
			<input type="text" disabled class="inputtext light mb05">
		</div>
	</template>
</template>