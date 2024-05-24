<script lang="ts">
  import { onMount } from "svelte";

  let clazz: string = "";
  export { clazz as class };
  export let id: string = "";
  export let value: string = "";
  export let placeholder: string = "0";
  export let autofocus: boolean = false;

  let node: HTMLInputElement;

  function onInput() {
    let elValue = node.value;

    if (elValue === "") {
      value = "";
      return;
    }

    if (!isNaN(elValue as any) && !isNaN(parseFloat(elValue))) {
      value = elValue;
    } else {
      let i = 0;
      while (value[i] === elValue[i]) {
        i++;
      }
      node.value = value;
      node.selectionStart = node.selectionEnd = i;
    }
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "." && value.includes(".")) {
      let ss = node.selectionStart || 0;
      let before = value.slice(0, ss);
      ss -= before.length - before.replace(/\./g, "").length;
      value = value.replace(/\./g, "");
      value = value.slice(0, ss) + "." + value.slice(ss);
      node.value = value;
      node.selectionStart = node.selectionEnd = ss;
    }
  }

  onMount(() => {
    if (autofocus) {
      node.focus();
    }
  });
</script>

<input
  bind:this={node}
  {value}
  {placeholder}
  on:input={onInput}
  on:keydown={onKeydown}
  on:click={(e) => e.stopPropagation()}
  class={clazz}
  size={value.length + 1}
  {id}
/>
