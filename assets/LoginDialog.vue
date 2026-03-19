<template>
  <Dialog v-model="show">
    <div style="padding: 20px; min-width: 300px;">
      <h2 style="margin-top: 0; margin-bottom: 20px;">登 录</h2>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">
          用户名
        </label>
        <input
          v-model="username"
          type="text"
          placeholder="输入用户名"
          style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;"
          @keyup.enter="login"
        />
      </div>
      
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">
          密码
        </label>
        <input
          v-model="password"
          type="password"
          placeholder="输入密码"
          style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;"
          @keyup.enter="login"
        />
      </div>
      
      <div v-if="error" style="color: red; margin-bottom: 15px; font-size: 14px;">
        {{ error }}
      </div>
      
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button
          @click="show = false"
          style="padding: 8px 20px; border: 1px solid #ccc; background: white; border-radius: 4px; cursor: pointer;"
        >
          取消
        </button>
        <button
          @click="login"
          style="padding: 8px 20px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;"
        >
          登录
        </button>
      </div>
    </div>
  </Dialog>
</template>

<script>
import Dialog from "./Dialog.vue";

export default {
  components: { Dialog },
  props: {
    modelValue: Boolean,
  },
  emits: ["update:modelValue", "login"],
  data() {
    return {
      username: "",
      password: "",
      error: "",
    };
  },
  computed: {
    show: {
      get() {
        return this.modelValue;
      },
      set(val) {
        this.$emit("update:modelValue", val);
      },
    },
  },
  methods: {
    login() {
      if (!this.username || !this.password) {
        this.error = "用户名和密码不能为空";
        return;
      }
      this.error = "";
      this.$emit("login", {
        username: this.username,
        password: this.password,
      });
      this.username = "";
      this.password = "";
      this.show = false;
    },
  },
};
</script>
