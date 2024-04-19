
class simpleCpu():
    def __init__(self):
        self.registers = [0] * 8   #假设有8个通用寄存器
        self.memory = [0] * 1024    #假设有1字节的内存空间
        self.programe_counter = 0   #初始化程序计数器PC

    def load_program(self,program_bytes):
        """加载机器码到内存中"""
        assert len(program_bytes) <= len(self.memory),"Progarm too large for memory"
        self.memory[:len(program_bytes)] = program_bytes    #如果没有溢出,则载入到内存中
        self.programe_counter = 0   #重置PC

    def fetch_instruction(self):
        """从内存中获取当前指令"""
        instruction = self.memory[self.programe_counter]    #取出当前指令
        self.programe_counter += 1      #PC自增,指向下一条指令
        return instruction
    
    def execute_instruction(self,instruction):
        """执行一条指令"""
        # 0xF0的二进制数是11110000,通过按位与运算,可以保留指令的高四位,同时把第四位清零
        #换言之,这个简单Cpu的操作码存储在高四位
        op_code = instruction & 0xF0    #提取操作码
        # 0x0F的二进制数是00001111,原理同上
        operand = instruction & 0x0F    #提取操作数

        if op_code == 0x10:             #0x10表示ADD指令
            # 0x07二进制数为00000111
            reg_dest = operand & 0x07   #提取目标寄存器索引
            reg_src = (operand >> 3) & 0x07     #提取源寄存器索引
            self.registers[reg_dest] += self.registers[reg_src]     #执行加法指令
