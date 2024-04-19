
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

        #ADD指令
        if op_code == 0x10:             #0x10表示ADD指令
            # 0x07二进制数为00000111
            reg_dest = operand & 0x07   #提取目标寄存器索引
            reg_src = (operand >> 3) & 0x07     #提取源寄存器索引
            self.registers[reg_dest] += self.registers[reg_src]     #执行加法指令

        #SUB指令
        if op_code == 0x20:
            reg_dest = operand & 0x07   #提取目标寄存器索引
            reg_src = (operand >> 3) & 0x07     #提取源寄存器索引
            self.registers[reg_dest] -= self.registers[reg_src]     #执行减法指令


        #STORE指令
        #具体功能就是将目标寄存器中的值存入内存
        if op_code == 0x30:             #0x20表示STORE指令
            reg_dest = operand & 0x07    #提取目标寄存器索引
            mem_addr = self.registers[reg_dest]   #获取源寄存器值作为要存入的内存的值
            self.memory[mem_addr]   = self.registers[reg_src]  #将寄存器的值存入内存

        #LOAD指令
        #将内存中的值存入目标寄存器
        if op_code == 0x40:
            reg_dest = operand & 0x70   #提取目标寄存器索引
            reg_src = (operand >> 3) & 0x07 #提取源寄存器索引
            mem_addr = self.registers[reg_src]  #获取源寄存器内的值作为存入目标寄存器的值
            self.registers[reg_dest] = self.memory[mem_addr]
        
        #JMP指令
        #将目标寄存器中的值作为程序要执行的目标地址
        if op_code == 0x50:
            reg_dest = operand & 0x07
            jmp_addr = self.registers[reg_dest]  #将目标寄存器中的值作为目标地址
            self.programe_counter = jmp_addr    #更新程序计数器,直接跳转至目标地址
        
        #CMP指令
        #将两个寄存器中的值进行比较,然后返回状态值
        if op_code == 0x60:
            reg1 = operand & 0x07
            reg2 = (operand >> 3) & 0x07
            value1 = self.registers[reg1]
            value2 = self.registers[reg2]

            #这里假设条件寄存器为self.condition_codes
            #后续根据实际来进行更新
            self.condition_codes[0] = (value1 == value2)    #相等
            self.condition_codes[1] = (value1 < value2)
            self.condition_codes[2] = (value1 > value2)
        
        #AND指令
        #将目标寄存器与源寄存器中的值进行与操作,并将结果存回目标寄存器
        if op_code == 0x80:
            reg_dest = operand & 0x07
            reg_src = (operand >> 3) & 0x07
            self.registers[reg_dest] &= self.registers[reg_src]     #执行逻辑与操作

        #OR指令
        #将目标寄存器与源寄存器中的值进行或操作,并将结果存回目标寄存器
        if op_code == 0x90:
            reg_dest = operand & 0x07
            reg_src = (operand >> 3) & 0x07
            self.registers[reg_dest] |= self.registers[reg_src]     #执行逻辑或操作
        
        #XOR指令
        #将目标寄存器与源寄存器中的值进行异或操作,并将结果存回目标寄存器
        if op_code == 0xA0:
            reg_dest = operand & 0x07
            reg_src = (operand >> 3) & 0x07
            self.registers[reg_dest] ^= self.registers[reg_src]
        
        #NOT指令
        #将目标寄存器中的值进行逻辑取反操作,并将结果存回目标寄存器
        if op_code == 0xB0:
            reg_dest = operand & 0x07
            self.registers[reg_dest] = ~self.registers[reg_dest]
        
        #SHL(逻辑左移)指令
        if op_code == 0xC0:
            reg_dest = operand & 0x07
            shift_amount = (operand >> 3) & 0x07    #获取逻辑左移的位数
            self.registers[reg_dest] <<= shift_amount   #执行逻辑左移操作
        
        #SHR(逻辑右移)指令
        if op_code == 0xD0:
            reg_dest = operand & 0x07
            shift_amount = (operand >> 3) & 0x07    #获取逻辑左移的位数
            self.registers[reg_dest] >>= shift_amount   #执行逻辑左移操作
        
        #MOV指令
        #将源寄存器中的值写入目标寄存器中,或将立即数写入目标寄存器中
        if op_code == 0xE0:
            reg_dest = operand & 0x07
            src_type = (operand >> 3) & 0x01    #源类型(0:寄存器    1:立即数)
            src_value = None

            if src_type == 0:   #从寄存器到寄存器的数据传送
                #0x07二进制为00000111,保存高4位中的低三位,从而可以保存的数为0-255
                reg_src = (operand >> 4) & 0x07
                src_value = self.registers[reg_src]
            else:               #从立即数到寄存器的数据传送
                #0x0F二进制为00001111,高四位包含了立即数
                src_value = (operand >> 4) & 0x0F
            self.registers[reg_dest] = src_value








        
        
    def run(self):
        """运行程序直到结束"""
        while True:
            instruction = self.fetch_instruction()
            if instruction == 0x00:     #0x00代表HALT指令,HAT指令代表cpu停止执行程序或者进入
                break                   #低功耗模式
            self.execute_instruction(instruction)
